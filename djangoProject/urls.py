"""
URL configuration for djangoProject project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from myapp.views import *
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.views import LogoutView


urlpatterns = [
    path('index/', index, name='index'),
    path('', index, name='/'),
    path('admin/', admin.site.urls),
    path('get_login_code/', get_login_code, name='get_login_code'),
    path('get_register_code/', get_register_code, name='get_login_code'),
    path('register/', register_view, name='register'),
    path('login/', login_view, name='login_view'),
    path('create_test/', create_test, name='create_test'),
    path('logout/', LogoutView.as_view(next_page='index'), name='logout'),
    path('save_survey/', save_survey, name='save_survey'),
    path('survey/<int:survey_id>/', survey_detail, name='survey-detail'),
    path('survey_results/<int:survey_id>/', survey_results, name='survey_results'),
    path('survey_results/<int:survey_id>/<int:user_id>/', user_results, name='user_results'),
    path('save_answers/', save_answers, name='save_answers'),
    path('complete_survey/', complete_survey, name='complete_survey'),
    path('results/', results, name='results'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

