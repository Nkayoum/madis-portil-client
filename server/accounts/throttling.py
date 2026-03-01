from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    """
    Limits login attempts for anonymous users (prevent brute-force).
    Slightly higher rate for testing, but blocks rapid requests.
    """
    scope = 'login'
    rate = '10/minute'

class OTPRequestThrottle(UserRateThrottle):
    """
    Limits the number of times an OTP can be requested by an authenticated user
    (or during the login flow).
    """
    scope = 'otp'
    rate = '3/minute'
