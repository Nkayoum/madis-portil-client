import datetime
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.db.models.functions import TruncMonth
from accounts.permissions import IsAdminMaDis, IsOwnerOrAdmin
from .models import FinancialTransaction, Wallet, CashCall, Settlement
from .serializers import (
    FinancialTransactionSerializer, 
    WalletSerializer, 
    CashCallSerializer, 
    SettlementSerializer
)

class WalletViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly access to Wallets.
    Admins can see all. Owners can see their own.
    """
    serializer_class = WalletSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    filterset_fields = ['property']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN_MADIS':
            return Wallet.objects.all()
        return Wallet.objects.filter(property__owner=user)

class CashCallViewSet(viewsets.ModelViewSet):
    """
    CRUD for Cash Calls.
    """
    serializer_class = CashCallSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN_MADIS':
            return CashCall.objects.all()
        return CashCall.objects.filter(property__owner=user)

    def perform_create(self, serializer):
        # Additional check to ensure user doesn't create for others? 
        # IsOwnerOrAdmin handles read, but validation logic might be needed.
        # For now, we trust the serializer context logic.
        serializer.save(created_by=self.request.user)

class SettlementViewSet(viewsets.ModelViewSet):
    """
    CRUD for Settlements.
    """
    serializer_class = SettlementSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN_MADIS':
            return Settlement.objects.all()
        return Settlement.objects.filter(property__owner=user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class FinancialTransactionViewSet(viewsets.ModelViewSet):
    """
    CRUD for financial transactions.
    - Admins see all.
    - Owners see transactions for their properties.
    """
    serializer_class = FinancialTransactionSerializer
    filterset_fields = ['property', 'type', 'category', 'date', 'site']
    ordering_fields = ['date', 'amount', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return FinancialTransaction.objects.none()
        
        if user.role == 'ADMIN_MADIS':
            return FinancialTransaction.objects.all()
        
        return FinancialTransaction.objects.filter(Q(owner=user) | Q(property__owner=user, owner__isnull=True))

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminMaDis()]
        return [IsOwnerOrAdmin()]

    def perform_create(self, serializer):
        prop = serializer.validated_data.get('property')
        serializer.save(created_by=self.request.user, owner=prop.owner if prop else None)

    @action(detail=False, methods=['get'], url_path='dashboard-stats')
    def dashboard_stats(self, request):
        """
        Calculates financial stats for the dashboard.
        """
        user = request.user
        queryset = self.filter_queryset(self.get_queryset())

        # Extract property_id and year from query parameters for filtering and debugging
        property_id = request.query_params.get('property') or request.query_params.get('property_id')
        year = request.query_params.get('year') # Assuming year might be passed for debugging context
        
        isAdmin = (user.role == 'ADMIN_MADIS')

        if property_id:
            queryset = queryset.filter(property_id=property_id)

        # 1. Base Aggregations with Category Strictness
        # Rental / Management Metrics
        rent_total = queryset.filter(category=FinancialTransaction.Category.RENT, type=FinancialTransaction.TransactionType.INFLOW).aggregate(total=Sum('amount'))['total'] or 0
        management_commissions = queryset.filter(
            category=FinancialTransaction.Category.COMMISSION
        ).exclude(
            parent_transaction__category=FinancialTransaction.Category.PROMOTION_SALE
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Operational Expenses (Excluding MaDis profit, capital investment AND construction costs)
        managed_expenses = queryset.filter(
            type=FinancialTransaction.TransactionType.OUTFLOW
        ).exclude(
            category__in=[
                FinancialTransaction.Category.PROMOTION_SALE, 
                FinancialTransaction.Category.COMMISSION,
                FinancialTransaction.Category.MATERIAUX,
                FinancialTransaction.Category.MAIN_D_OEUVRE,
                FinancialTransaction.Category.SERVICES
            ]
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Transactional / Investment Metrics
        sales_volume = queryset.filter(
            category=FinancialTransaction.Category.PROMOTION_SALE, 
            type=FinancialTransaction.TransactionType.INFLOW
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        investment_commissions = queryset.filter(
            category=FinancialTransaction.Category.COMMISSION,
            parent_transaction__category=FinancialTransaction.Category.PROMOTION_SALE
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        capital_invest = queryset.filter(
            type=FinancialTransaction.TransactionType.OUTFLOW,
            category=FinancialTransaction.Category.PROMOTION_SALE
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Overall totals (for legacy/summary compatibility)
        inflow = queryset.filter(type=FinancialTransaction.TransactionType.INFLOW).aggregate(total=Sum('amount'))['total'] or 0
        all_outflow = queryset.filter(type=FinancialTransaction.TransactionType.OUTFLOW).aggregate(total=Sum('amount'))['total'] or 0
        
        # Construction costs (Investissement Travaux)
        construction_costs = queryset.filter(
            category__in=[
                FinancialTransaction.Category.MATERIAUX,
                FinancialTransaction.Category.MAIN_D_OEUVRE,
                FinancialTransaction.Category.SERVICES
            ]
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        operating_outflow = all_outflow - (capital_invest + construction_costs)

        # Property breakdown (for bar chart / list)
        today = timezone.now().date()
        twelve_months_ago = today - datetime.timedelta(days=365)
        
        property_stats = queryset.values(
            'property__id', 'property__name', 'property__prix_vente', 'property__prix_acquisition',
            'property__frais_acquisition_annexes',
            'property__budget_total', 'property__loyer_mensuel',
            'property__date_acquisition', 'property__created_at'
        ).annotate(
            revenues=Sum('amount', filter=Q(category=FinancialTransaction.Category.RENT, type=FinancialTransaction.TransactionType.INFLOW)),
            expenses=Sum('amount', filter=Q(type=FinancialTransaction.TransactionType.OUTFLOW) & ~Q(category__in=[
                FinancialTransaction.Category.PROMOTION_SALE,
                FinancialTransaction.Category.MATERIAUX,
                FinancialTransaction.Category.MAIN_D_OEUVRE,
                FinancialTransaction.Category.SERVICES
            ])),
            rev_12m=Sum('amount', filter=Q(category=FinancialTransaction.Category.RENT, type=FinancialTransaction.TransactionType.INFLOW, date__gte=twelve_months_ago)),
            exp_12m=Sum('amount', filter=Q(type=FinancialTransaction.TransactionType.OUTFLOW, date__gte=twelve_months_ago) & ~Q(category__in=[
                FinancialTransaction.Category.PROMOTION_SALE,
                FinancialTransaction.Category.MATERIAUX,
                FinancialTransaction.Category.MAIN_D_OEUVRE,
                FinancialTransaction.Category.SERVICES
            ])),
        ).order_by('-revenues')

        # Calculate yield for each property in property_stats
        formatted_property_stats = []
        realized_yield_annualized = 0
        theoretical_yield = 0
        
        for p in property_stats:
            try:
                base_price = float(p['property__prix_acquisition'] or p['property__prix_vente'] or p['property__budget_total'] or 0)
                annex_fees = float(p['property__frais_acquisition_annexes'] or 0)
                
                # Construction costs for this specific property
                prop_const_costs = FinancialTransaction.objects.filter(
                    property_id=p['property__id'],
                    category__in=[
                        FinancialTransaction.Category.MATERIAUX,
                        FinancialTransaction.Category.MAIN_D_OEUVRE,
                        FinancialTransaction.Category.SERVICES
                    ]
                ).aggregate(total=Sum('amount'))['total'] or 0
                
                investment = base_price + annex_fees + float(prop_const_costs)
                
                target_annual_rent = float(p['property__loyer_mensuel'] or 0) * 12
                
                # Role-aware revenue/expense for listing
                if isAdmin:
                    # For Admin, rental revenue is the management commission earned
                    rev = FinancialTransaction.objects.filter(
                        property_id=p['property__id'],
                        category=FinancialTransaction.Category.COMMISSION
                    ).exclude(
                        parent_transaction__category=FinancialTransaction.Category.PROMOTION_SALE
                    ).aggregate(total=Sum('amount'))['total'] or 0
                    exp = 0 # Admin's business view: they collect commissions, don't pay property expenses
                else:
                    rev = float(p['revenues'] or 0)
                    exp = float(p['expenses'] or 0)
                
                rev = float(rev)
                exp = float(exp)
                
                # The aggregates already filter out PROMOTION_SALE (acquisition capital)
                operating_exp = exp
                net = rev - operating_exp
                
                # Rolling 12m stats (for current Yield)
                if isAdmin:
                    rev_12m = FinancialTransaction.objects.filter(
                        property_id=p['property__id'],
                        category=FinancialTransaction.Category.COMMISSION,
                        date__gte=twelve_months_ago
                    ).exclude(
                        parent_transaction__category=FinancialTransaction.Category.PROMOTION_SALE
                    ).aggregate(total=Sum('amount'))['total'] or 0
                    exp_12m = 0
                else:
                    rev_12m = float(p['rev_12m'] or 0)
                    exp_12m = float(p['exp_12m'] or 0)
                
                rev_12m = float(rev_12m)
                exp_12m = float(exp_12m)
                
                operating_exp_12m = exp_12m
                net_12m = rev_12m - operating_exp_12m
                
                # Holding duration vs Management duration
                acquisition_date = p['property__date_acquisition'] or p['property__created_at'].date()
                if isinstance(acquisition_date, datetime.datetime):
                    acquisition_date = acquisition_date.date()
                
                # Active range logic: find earliest and latest rent periods in the rolling year
                rent_txs = FinancialTransaction.objects.filter(
                    property_id=p['property__id'],
                    category=FinancialTransaction.Category.RENT,
                    date__gte=twelve_months_ago
                ).order_by('period_year', 'period_month', 'date')
                
                first_rent = rent_txs.first()
                last_rent = rent_txs.last()
                
                # Management starts at acquisition OR the first rent period (if earlier recorded)
                yield_start_date = acquisition_date
                if first_rent:
                    if first_rent.period_year and first_rent.period_month:
                        p_start = datetime.date(first_rent.period_year, first_rent.period_month, 1)
                        if p_start > yield_start_date: yield_start_date = p_start
                    elif first_rent.date > yield_start_date:
                        yield_start_date = first_rent.date
                
                # Calculation "End" for duration: 
                # If future rents are paid, the duration should extend to cover them
                calc_end = today
                if last_rent and last_rent.period_year and last_rent.period_month:
                    import calendar
                    _, last_day = calendar.monthrange(last_rent.period_year, last_rent.period_month)
                    p_end = datetime.date(last_rent.period_year, last_rent.period_month, last_day)
                    if p_end > calc_end: calc_end = p_end
                
                days_active = max(1, (calc_end - yield_start_date).days)
                days_for_yield = min(days_active, 365.25)
                
                # Theoretical yield based on target rent
                theoretical_yield = (target_annual_rent / investment * 100) if investment > 0 else 0
                
                # Annualized Realized yield (Rolling 12m Speedometer - Period Based)
                realized_yield_annualized = 0
                if investment > 0 and days_for_yield > 0:
                    realized_yield_annualized = (net_12m / investment) / (days_for_yield / 365.25) * 100
                
                # Transactional ROI for this property
                prop_sale_rev = FinancialTransaction.objects.filter(
                    property_id=p['property__id'],
                    type=FinancialTransaction.TransactionType.INFLOW,
                    category=FinancialTransaction.Category.PROMOTION_SALE
                ).aggregate(total=Sum('amount'))['total'] or 0
                
                if isAdmin:
                    # For Admin, gain per property is the commission collected for that property's sale
                    prop_sale_comm = FinancialTransaction.objects.filter(
                        property_id=p['property__id'],
                        category=FinancialTransaction.Category.COMMISSION,
                        parent_transaction__category=FinancialTransaction.Category.PROMOTION_SALE
                    ).aggregate(total=Sum('amount'))['total'] or 0
                    
                    capital_gain = float(prop_sale_comm)
                    prop_trans_roi = round((capital_gain / float(prop_sale_rev) * 100), 2) if prop_sale_rev > 0 else 0
                else:
                    capital_gain = float(prop_sale_rev) - investment
                    prop_trans_roi = round((capital_gain / investment * 100), 2) if investment > 0 else 0

                formatted_property_stats.append({
                    'id': p['property__id'],
                    'name': p['property__name'],
                    'revenues': rev,
                    'expenses': exp,
                    'net': net,
                    'investment': investment,
                    'target_annual_rent': target_annual_rent,
                    'yield': round(realized_yield_annualized, 2),
                    'theoretical_yield': round(theoretical_yield, 2),
                    'transactional_roi': prop_trans_roi,
                    'capital_gain': capital_gain,
                    'days_active': days_active
                })
            except Exception as e:
                print(f"ERROR calculating stats for property {p.get('property__id')}: {e}")
                continue
        # Category breakdown for all transactions (Revenues & Expenses)
        category_stats = queryset.values('category').annotate(
            total=Sum('amount')
        ).order_by('-total')
        
        formatted_category_stats = [
            {'category': c['category'], 'label': dict(FinancialTransaction.Category.choices).get(c['category'], c['category']), 'total': float(c['total'])}
            for c in category_stats
        ]

        # Determine the reporting period (Last 12 months or since acquisition)
        # We'll go back up to 12 months from today
        reporting_start = today - datetime.timedelta(days=365)
        expected_monthly_rent = 0
        
        if property_id:
            from properties.models import Property
            try:
                prop = Property.objects.get(id=property_id)
                expected_monthly_rent = float(prop.loyer_mensuel or 0)
                # Adjust start if acquisition was more recent than 12 months
                acq_date = prop.date_acquisition or prop.created_at.date()
                if isinstance(acq_date, datetime.datetime):
                    acq_date = acq_date.date()
                if acq_date > reporting_start:
                    reporting_start = acq_date
            except Property.DoesNotExist:
                pass
        else:
            # Global view: Sum of all properties' rents as the global target
            from properties.models import Property
            total_rent = Property.objects.aggregate(total=Sum('loyer_mensuel'))['total'] or 0
            expected_monthly_rent = float(total_rent)

        # Generate the full calendar of months
        chart_data = {}
        curr = reporting_start
        # Align curr to the first of the month for the loop
        curr = datetime.date(curr.year, curr.month, 1)
        
        while curr <= today:
            month_str = curr.strftime('%Y-%m')
            
            # Rent Expectation Logic:
            # We only expect rent starting from the month AFTER acquisition,
            # or from the same month IF acquisition happened on the 1st.
            month_expected_rent = expected_monthly_rent
            if property_id:
                acq_d = prop.date_acquisition or prop.created_at.date()
                if isinstance(acq_d, datetime.datetime): acq_d = acq_d.date()
                
                # If this month is before acquisition, or is the month of acquisition (but not the 1st day)
                # then we don't expect a full rent yet.
                if curr < datetime.date(acq_d.year, acq_d.month, 1):
                    month_expected_rent = 0
                elif curr == datetime.date(acq_d.year, acq_d.month, 1) and acq_d.day > 1:
                    # Optional: could do prorated, but for simplicity let's say 0 until first full month
                    # or keep it simple: no expectation for the transition month
                    month_expected_rent = 0

            chart_data[month_str] = {
                'month': month_str,
                'revenues': 0,
                'expenses': 0,
                'rental_revenues': 0,
                'trans_revenues': 0,
                'rental_expenses': 0,
                'trans_expenses': 0,
                'actual_rent': 0,
                'expected_rent': month_expected_rent,
                'shortfall': month_expected_rent,
                'collection_rate': 0
            }
            # Increment month
            if curr.month == 12:
                curr = datetime.date(curr.year + 1, 1, 1)
            else:
                curr = datetime.date(curr.year, curr.month + 1, 1)

        # Monthly breakdown from queryset
        monthly_stats = queryset.values('property_id', 'period_year', 'period_month', 'date', 'type', 'category', 'parent_transaction__category').annotate(
            total=Sum('amount')
        ).order_by('period_year', 'period_month', 'date')

        # Cache property statuses for global fallback (Admin view)
        property_status_map = {}
        if isAdmin and not property_id:
            from properties.models import Property
            property_status_map = dict(Property.objects.values_list('id', 'status'))

        # Populate chart data with actuals
        for entry in monthly_stats:
            if entry['period_year'] and entry['period_month']:
                month_str = f"{entry['period_year']}-{entry['period_month']:02d}"
            else:
                month_str = entry['date'].strftime('%Y-%m')
            
            # If the month is outside our reporting range, we might skip or add it
            # But usually we'll just focus on the range generated
            if month_str not in chart_data:
                chart_data[month_str] = {
                    'month': month_str, 
                    'revenues': 0, 
                    'expenses': 0,
                    'rental_revenues': 0,
                    'trans_revenues': 0,
                    'rental_expenses': 0,
                    'trans_expenses': 0,
                    'actual_rent': 0,
                    'expected_rent': expected_monthly_rent,
                    'shortfall': expected_monthly_rent,
                    'collection_rate': 0
                }
            
            amount = float(entry['total'])
            target = chart_data[month_str]
            if entry['type'] == FinancialTransaction.TransactionType.INFLOW or (isAdmin and entry['category'] == FinancialTransaction.Category.COMMISSION):
                if isAdmin:
                    # For Admin, only consider commissions as their actual revenue
                    if entry['category'] == FinancialTransaction.Category.COMMISSION:
                        target['revenues'] += amount
                        # Partition by mode. Fallback to property status if parent link is missing (for legacy/seeds)
                        is_trans = entry['parent_transaction__category'] == FinancialTransaction.Category.PROMOTION_SALE
                        # Special check: if no parent category but it's a commission on a property marked as VENDU
                        # (This is a robust fallback for the Maison Bali case)
                        if not is_trans:
                            if property_id:
                                is_trans = prop.status == 'VENDU'
                            else:
                                p_id = entry.get('property_id')
                                is_trans = property_status_map.get(p_id) == 'VENDU'
                        
                        if is_trans:
                            target['trans_revenues'] += amount
                        else:
                            target['rental_revenues'] += amount
                else:
                    target['revenues'] += amount
                    # For owner, partition by source category
                    if entry['category'] == FinancialTransaction.Category.PROMOTION_SALE:
                        target['trans_revenues'] += amount
                    else:
                        target['rental_revenues'] += amount
                
                if entry['category'] == FinancialTransaction.Category.RENT:
                    target['actual_rent'] += amount
            elif entry['category'] != FinancialTransaction.Category.PROMOTION_SALE:
                # Exclude Acquisition Capital from the chart to maintain readability of operational flows
                target['expenses'] += amount
                # For Admin, expenses are usually 0 in rental (management), 
                # but we track outflows that aren't commissions or property purchase
                if isAdmin:
                    if entry['category'] != FinancialTransaction.Category.COMMISSION:
                        target['rental_expenses'] += amount
                else:
                    target['rental_expenses'] += amount
            else:
                # For Owner, PROMOTION_SALE OUTFLOW is the investment cost
                target['trans_expenses'] += amount

        # Final pass for monthly rates and gaps
        for month in chart_data.values():
            if month['expected_rent'] > 0:
                month['shortfall'] = max(0, month['expected_rent'] - month['actual_rent'])
                month['collection_rate'] = round((month['actual_rent'] / month['expected_rent']) * 100, 1)
            else:
                month['shortfall'] = 0
                month['collection_rate'] = 100 if month['actual_rent'] > 0 else 0

        # Recent transactions
        recent_transactions = queryset.order_by('-date', '-created_at')[:10]
        recent_transactions_serializer = FinancialTransactionSerializer(recent_transactions, many=True)

        # Calculate overall collection rate for the summary
        # We exclude the current month to show "Arrears / Past Due" only, 
        # satisfying the user's need for a 0€ shortfall on day one of acquisition.
        curr_month = today.strftime('%Y-%m')
        overall_expected = sum(m['expected_rent'] for m in chart_data.values() if m['month'] < curr_month)
        overall_actual = sum(m['actual_rent'] for m in chart_data.values() if m['month'] < curr_month)

        if overall_expected > 0:
            collection_rate = round((overall_actual / overall_expected * 100), 1)
        else:
            collection_rate = None # Indicate it's not applicable

        # Calculate global context ROI
        global_roi = 0
        global_theoretical_yield = 0
        if user.role == 'ADMIN_MADIS':
            # For Admin, global ROI is always the commission margin on volume or total gross flow
            basis = float(sales_volume) if sales_volume > 0 else float(inflow)
            if basis > 0:
                global_roi = round((float(management_commissions + investment_commissions) / basis) * 100, 2)
        elif property_id:
            global_roi = round(realized_yield_annualized, 2)
            global_theoretical_yield = round(theoretical_yield, 2)
        else:
            # For owners/global, use weighted average of all properties
            total_inv_global = sum(p['investment'] for p in formatted_property_stats)
            if total_inv_global > 0:
                global_roi = round(sum(p['yield'] * p['investment'] for p in formatted_property_stats) / total_inv_global, 2)
                global_theoretical_yield = round(sum(p['theoretical_yield'] * p['investment'] for p in formatted_property_stats) / total_inv_global, 2)

        # Final Net Revenue: For Admin, always show commissions collected (their profit)
        # For Owners, show Operating Net (Inflow - Operating Outflow)
        final_net_revenue = float(inflow - operating_outflow)
        if isAdmin:
            final_net_revenue = float(management_commissions + investment_commissions)

        # Final segments based on user request (Separating Investment/Sales vs Rental/Management)
        
        # 1. Rental Performance (Management)
        # For Admin, Net Rental Revenue = Commissions from Rents
        admin_rental_net = float(management_commissions) if isAdmin else float(rent_total - managed_expenses)

        rental_performance = {
            'net_revenue': admin_rental_net,
            'total_inflow': float(rent_total),
            'total_outflow': float(managed_expenses) if isAdmin else float(managed_expenses + management_commissions),
            'yield': global_roi,
            'theoretical_yield': global_theoretical_yield,
            'collection_rate': collection_rate,
            'shortfall': max(0, overall_expected - overall_actual),
            'commission_total': float(management_commissions)
        }

        # 2. Transactional Performance (Investment/Achat-Revente)
        purchase_cost = capital_invest
        # For Admin, Gain = Commissions on Sales
        # For Owner, Gain = Sale Revenue - Purchase Cost
        admin_trans_gain = float(investment_commissions) if isAdmin else float(sales_volume - purchase_cost)
        
        admin_trans_roi = 0
        if isAdmin:
            if sales_volume > 0:
                admin_trans_roi = round((float(investment_commissions) / float(sales_volume)) * 100, 2)
        elif purchase_cost > 0:
            admin_trans_roi = round((admin_trans_gain / float(purchase_cost)) * 100, 2)

        transactional_performance = {
            'sales_volume': float(sales_volume),
            'investment_total': float(purchase_cost),
            'net_capital_gain': admin_trans_gain,
            'roi': admin_trans_roi,
        }

        # Determine which performance profile is most relevant as a "summary" for this property
        summary_profile = rental_performance
        if property_id:
            from properties.models import Property
            prop_obj = Property.objects.get(id=property_id)
            # If the property is marked as a sale or sold, use transactional summary (Owner Focus)
            if prop_obj.transaction_nature == 'VENTE' or prop_obj.status == 'VENDU':
                actual_sale_price = float(sales_volume)
                acq_price = float(prop_obj.prix_acquisition or 0)
                acq_fees = float(prop_obj.frais_acquisition_annexes or 0)
                const_costs = float(construction_costs)
                
                # Use real sale price if available, otherwise target price
                effective_price = actual_sale_price if actual_sale_price > 0 else float(prop_obj.prix_vente or 0)
                
                # Formula aligned for consistency:
                # Margin = Selling Price - (Acquisition + Fees + Construction)
                # Commission = Margin * Commission Rate
                # Plus-value = Margin - Commission
                total_invested_capital = acq_price + acq_fees + const_costs
                project_margin = effective_price - total_invested_capital
                
                # Calculate real or estimated commission (Now on Margin!)
                if actual_sale_price > 0:
                    effective_comm = float(investment_commissions)
                else:
                    if prop_obj.commission_type == 'POURCENTAGE' and prop_obj.commission_rate:
                        # Commission on Margin for Sale properties
                        effective_comm = (project_margin * float(prop_obj.commission_rate)) / 100
                    elif prop_obj.commission_type == 'FIXE' and prop_obj.commission_fixe:
                        effective_comm = float(prop_obj.commission_fixe)
                    else:
                        effective_comm = 0
                
                # Ensure commission is not negative (if margin is negative, commission is 0)
                effective_comm = max(0, float(effective_comm))
                
                total_net_profit = project_margin - effective_comm
                
                owner_roi = (total_net_profit / total_invested_capital * 100) if total_invested_capital > 0 else 0
                
                summary_profile = {
                    'net': total_net_profit, # Now correctly showing 12000 in this case
                    'roi': owner_roi,
                    'investment': total_invested_capital,
                    'sales_volume': effective_price,
                    'is_realized': actual_sale_price > 0
                }

        return Response({
            'rental_performance': rental_performance,
            'transactional_performance': transactional_performance,
            'property_summary': summary_profile if property_id else None,
            'category_stats': formatted_category_stats,
            'property_stats': formatted_property_stats,
            'monthly_data': sorted(chart_data.values(), key=lambda x: x['month']),
            'recent_transactions': recent_transactions_serializer.data,
            'net_revenue': rental_performance['net_revenue'],
            'total_inflow': rental_performance['total_inflow'],
            'total_outflow': rental_performance['total_outflow'],
            'global_roi': global_roi,
            'isAdmin': isAdmin
        })
