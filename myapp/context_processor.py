from .models import UserMarket  # Замените `myapp` на имя вашего приложения


def balance_processor(request):
    user = request.user
    if user.is_authenticated:
        user_market = UserMarket.objects.filter(user=user).first()
    else:
        user_market = None
    return {'user_market': user_market}


def user_processor(request):
    user = request.user if request.user.is_authenticated else None
    return {'user': user}
