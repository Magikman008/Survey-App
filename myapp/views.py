from django.shortcuts import render, get_object_or_404
from django.template.loader import render_to_string
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login
from .models import *
import json
import logging
logger = logging.getLogger(__name__)


def index(request):
    user = request.user if request.user.is_authenticated else None
    completed_surveys = SurveyCompletion.objects.filter(user=user).values_list('survey_id', flat=True)
    surveys = Survey.objects.exclude(id__in=completed_surveys)
    return render(request, 'index.html', {'user': user, 'surveys': surveys})


def results(request):
    user = request.user if request.user.is_authenticated else None
    surveys = Survey.objects.all()
    return render(request, 'results.html', {'user': user, 'surveys': surveys})


def survey_results(request, survey_id):
    user = request.user if request.user.is_authenticated else None
    survey = Survey.objects.get(id=survey_id)
    completed_surveys = SurveyCompletion.objects.filter(survey_id=survey_id)
    users = [completion.user for completion in completed_surveys]

    return render(request, 'survey_result.html', {'users': users, 'survey': survey})


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
            logger.debug(is_required)
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
    survey = get_object_or_404(Survey, id=survey_id)
    questions = survey.question_set.all()
    return render(request, 'survey_detail.html', {'survey': survey, 'questions': questions})


def user_results(request, survey_id, user_id):
    survey = get_object_or_404(Survey, id=survey_id)
    user = get_object_or_404(User, id=user_id)
    questions = survey.question_set.all()

    user_answers = UserAnswer.objects.filter(user=user, question__in=questions)

    text_answers = UserAnswer.objects.none()
    selected_options = UserAnswer.objects.none()

    for answer in user_answers:
        if answer.text_answer:
            text_answers = text_answers | UserAnswer.objects.filter(pk=answer.pk)
        selected_options = selected_options.union(answer.selected_options.all())

    return render(request, 'user_result.html', {'survey': survey, 'questions': questions, 'user_answers': selected_options, 'text_answers': text_answers})


def save_answers(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        logger.debug(data.items())

        for question_id, answer_data in data.items():
            question = Question.objects.get(pk=question_id)
            user_answer = UserAnswer(user=request.user, question=question)
            user_answer.save()  # Сохраняем объект UserAnswer перед установкой ManyToMany-отношения

            if 'answer_text' in answer_data:
                user_answer.text_answer = answer_data['answer_text']

            if 'answer_options' in answer_data:
                answer_options_ids = answer_data['answer_options']
                answer_options = AnswerOption.objects.filter(pk__in=answer_options_ids)
                user_answer.selected_options.set(answer_options)

            user_answer.save()  # Сохраняем модель UserAnswer после установки ManyToMany-отношения

        return JsonResponse({'success': True})

    return JsonResponse({'success': False})


def complete_survey(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        logger.debug(data.items())
        survey_id = data.get('survey_id')
        survey = get_object_or_404(Survey, id=survey_id)
        survey_completion = SurveyCompletion(user=request.user, survey=survey)
        survey_completion.save()  #

        return JsonResponse({'success': True})

    return JsonResponse({'success': False})

