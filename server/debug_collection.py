import os
import django
import sys

# Setup Django
sys.path.append('c:\\Users\\bytes\\OneDrive\\Documents\\DEV Bytes\\test\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from finance.models import FinancialTransaction
from properties.models import Property
from django.db.models import Sum

def debug_stats():
    # Try to find a property with a monthly rent set
    prop = Property.objects.filter(loyer_mensuel__gt=0).first()
    if not prop:
        print("No property found with monthly rent > 0")
        # Try any property
        prop = Property.objects.first()
    
    if not prop:
        print("No property found at all.")
        return

    print(f"Testing for Property: {prop.name} (ID: {prop.id})")
    print(f"Expected Monthly Rent: {prop.loyer_mensuel}")

    # Simulate logic from views.py
    property_id = prop.id
    queryset = FinancialTransaction.objects.filter(property_id=property_id)
    
    expected_monthly_rent = float(prop.loyer_mensuel or 0)
    
    monthly_stats = queryset.values('period_year', 'period_month', 'date', 'type', 'category').annotate(
        total=Sum('amount')
    ).order_by('period_year', 'period_month', 'date')

    chart_data = {}
    for entry in monthly_stats:
        if entry['period_year'] and entry['period_month']:
            month_str = f"{entry['period_year']}-{entry['period_month']:02d}"
        else:
            month_str = entry['date'].strftime('%Y-%m')
            
        if month_str not in chart_data:
            chart_data[month_str] = {
                'month': month_str, 
                'revenues': 0, 
                'expenses': 0,
                'actual_rent': 0,
                'expected_rent': expected_monthly_rent,
                'shortfall': expected_monthly_rent,
                'collection_rate': 0
            }
        
        amount = float(entry['total'])
        if entry['type'] == FinancialTransaction.TransactionType.INFLOW:
            chart_data[month_str]['revenues'] += amount
            if entry['category'] == FinancialTransaction.Category.RENT:
                chart_data[month_str]['actual_rent'] += amount
        else:
            chart_data[month_str]['expenses'] += amount

    for month in chart_data.values():
        if month['expected_rent'] > 0:
            month['shortfall'] = max(0, month['expected_rent'] - month['actual_rent'])
            month['collection_rate'] = round((month['actual_rent'] / month['expected_rent']) * 100, 1)
        else:
            month['shortfall'] = 0
            month['collection_rate'] = 100 if month['actual_rent'] > 0 else 0

    overall_expected = 0
    overall_actual = 0
    if property_id and expected_monthly_rent > 0:
        num_months = len(chart_data)
        overall_expected = expected_monthly_rent * num_months
        overall_actual = sum(m['actual_rent'] for m in chart_data.values())

    collection_rate = round((overall_actual / overall_expected * 100), 1) if overall_expected > 0 else 0
    
    print(f"Calculated Collection Rate: {collection_rate}")
    print(f"Overall Expected: {overall_expected}")
    print(f"Overall Actual: {overall_actual}")
    print(f"Number of months: {len(chart_data)}")
    
    # Check if key is in the final summary structure
    summary = {
        'collection_rate': collection_rate,
        'shortfall': max(0, overall_expected - overall_actual)
    }
    print(f"Summary keys: {list(summary.keys())}")
    print(f"Collection rate in summary: {summary.get('collection_rate')}")

if __name__ == "__main__":
    debug_stats()
