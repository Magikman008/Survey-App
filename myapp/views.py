import json
import logging

from django.contrib.auth import login
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.forms import UserCreationForm
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import render, get_object_or_404
from django.template.loader import render_to_string

from .models import *

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_user_market(sender, instance, created, **kwargs):
    if created:
        user_market = UserMarket.objects.create(user=instance, balance=0)
        color = Color.objects.get(id=1)
        user_market.purchased_colors.add(color)


def index(request):
    user = request.user if request.user.is_authenticated else None
    completed_surveys = SurveyCompletion.objects.filter(user=user).values_list('survey_id', flat=True)
    surveys = Survey.objects.exclude(id__in=completed_surveys)
    return render(request, 'index.html', {'user': user, 'surveys': surveys})


def results(request):
    user = request.user if request.user.is_authenticated else None
    surveys = Survey.objects.all()
    return render(request, 'results.html', {'user': user, 'surveys': surveys})


def market(request):
    colors = Color.objects.all()
    user = request.user if request.user.is_authenticated else None
    if user:
        user_market = UserMarket.objects.get(user=user)
    else:
        user_market = None
    return render(request, 'market.html', {'colors': colors, 'user_market': user_market})


def survey_results(request, survey_id):
    survey = Survey.objects.get(id=survey_id)
    completed_surveys = SurveyCompletion.objects.filter(survey_id=survey_id)
    users = [completion.user for completion in completed_surveys]

    return render(request, 'survey_result.html', {'users': users, 'survey': survey})


def stats(request):
    users = User.objects.all()
    completed_surveys = SurveyCompletion.objects.all()

    return render(request, 'stats.html', {'users': users, 'surveys': completed_surveys})


def create_test(request):
    user = request.user if request.user.is_authenticated else None
    return render(request, 'create_test.html', {'user': user})


def get_register_code(request):
    context = {'csrf_token': get_token(request)}
    html_code = render_to_string('register.html', context)
    return JsonResponse({'html_code': html_code})


def get_login_code(request):
    context = {'csrf_token': get_token(request)}
    html_code = render_to_string('login.html', context)
    return JsonResponse({'html_code': html_code})


def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            response_data = {'success': True}
        else:
            response_data = {'success': False, 'errors': form.errors}
        return JsonResponse(response_data)
    else:
        form = AuthenticationForm()

    return render(request, 'login.html', {'form': form})


def register_view(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            response_data = {'success': True}
        else:
            response_data = {'success': False, 'errors': form.errors}
        return JsonResponse(response_data)
    else:
        form = UserCreationForm()

    return render(request, 'testreg.html', {'form': form})


def save_survey(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        title = data.get('title')
        description = data.get('description')
        questions = data.get('questions')
        price = data.get('price')

        survey = Survey(title=title, description=description, price=price)
        survey.save()

        for question_data in questions:
            question_text = question_data.get('text')
            question_type = question_data.get('type')
            is_required = question_data.get('required')
            question = Question(survey=survey, text=question_text, type=question_type, is_required=bool(is_required))
            question.save()

            if question_type in ['checkbox', 'radio']:
                options = question_data.get('options')
                for option_text in options:
                    answer_option = AnswerOption(question=question, text=option_text)
                    answer_option.save()

        response_data = {'success': True}
    else:
        response_data = {'success': False}

    return JsonResponse(response_data)


def survey_detail(request, survey_id):
    user = request.user
    survey = get_object_or_404(Survey, id=survey_id)
    if SurveyCompletion.objects.filter(user=user, survey=survey).exists():
        survey = None
        questions = None
    else:
        questions = survey.question_set.all()
    return render(request, 'survey_detail.html', {'survey': survey, 'questions': questions})


def user_results(request, survey_id, user_id):
    survey = get_object_or_404(Survey, id=survey_id)
    inter = get_object_or_404(User, id=user_id)
    questions = survey.question_set.all()

    user_answers = UserAnswer.objects.filter(user=inter, question__in=questions)

    text_answers = UserAnswer.objects.none()
    selected_options = UserAnswer.objects.none()

    for answer in user_answers:
        if answer.text_answer:
            text_answers = text_answers | UserAnswer.objects.filter(pk=answer.pk)
        selected_options = selected_options.union(answer.selected_options.all())

    return render(request, 'user_result.html',
                  {'inter': inter, 'survey': survey, 'questions': questions, 'user_answers': selected_options,
                   'text_answers': text_answers})


def save_answers(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        for question_id, answer_data in data.items():
            question = Question.objects.get(pk=question_id)
            user_answer = UserAnswer(user=request.user, question=question)
            user_answer.save()

            if 'answer_text' in answer_data:
                user_answer.text_answer = answer_data['answer_text']

            if 'answer_options' in answer_data:
                answer_options_ids = answer_data['answer_options']
                answer_options = AnswerOption.objects.filter(pk__in=answer_options_ids)
                user_answer.selected_options.set(answer_options)

            user_answer.save()

        return JsonResponse({'success': True})

    return JsonResponse({'success': False})


def complete_survey(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        survey_id = data.get('survey_id')
        survey = get_object_or_404(Survey, id=survey_id)
        survey_completion = SurveyCompletion(user=request.user, survey=survey)
        survey_completion.save()

        user_market = UserMarket.objects.get(user=request.user)
        user_market.balance += int(survey.price)
        user_market.save()

        return JsonResponse({'success': True})

    return JsonResponse({'success': False})


def add_color(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        color_name = data.get('name')
        color_hex = data.get('hex_code')
        color_cost = data.get('cost')

        color = Color(name=color_name, hex_code=color_hex, cost=color_cost)
        color.save()

        return JsonResponse({'success': True})

    return JsonResponse({'success': False})


def purchase_color(request):
    if request.method == 'POST':
        color_id = request.POST.get('color_id')
        color = get_object_or_404(Color, id=color_id)
        user_market = get_object_or_404(UserMarket, user=request.user)

        # Проверяем, был ли цвет уже приобретен пользователем
        if color in user_market.purchased_colors.all():
            return JsonResponse({'success': False, 'message': 'Цвет уже приобретен'})

        # Проверяем, достаточно ли средств на балансе пользователя
        if user_market.balance < color.cost:
            return JsonResponse({'success': False, 'message': 'Недостаточно средств на балансе'})

        # Выполняем покупку цвета
        user_market.purchased_colors.add(color)
        user_market.balance -= color.cost
        user_market.save()

        return JsonResponse({'success': True, 'message': 'Цвет успешно приобретен'})

    return JsonResponse({'success': False, 'message': 'Ошибка при отправке запроса'})


def activate_color(request):
    if request.method == 'POST':
        color_id = request.POST.get('color_id')
        color = get_object_or_404(Color, id=color_id)
        user_market = get_object_or_404(UserMarket, user=request.user)

        user_market.active_color = color
        user_market.save()

        return JsonResponse({'success': True, 'message': 'Цвет успешно приобретен'})

    return JsonResponse({'success': False, 'message': 'Ошибка при отправке запроса'})
