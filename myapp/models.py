from django.db import models
from django.contrib.auth.models import User
# from django.contrib.auth.models import AbstractUser
#
#
# class CustomUser(AbstractUser):
#     # Добавьте дополнительные поля, необходимые для расширенной модели пользователя
#     age = models.PositiveIntegerField(null=True, blank=True)
#     address = models.CharField(max_length=255, null=True, blank=True)
#     # и так далее...


class Survey(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    date_completed = models.DateTimeField(auto_now_add=True)
    price = models.IntegerField(default=0)


class Question(models.Model):
    TYPE_CHOICES = (
        ('checkbox', 'Флажки'),
        ('radio', 'Один выбор'),
        ('text', 'Текстовый ответ'),
    )
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE)
    text = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    is_required = models.BooleanField(default=False)


class AnswerOption(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    text = models.CharField(max_length=255)


class UserAnswer(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    text_answer = models.TextField(blank=True, null=True)
    selected_options = models.ManyToManyField(AnswerOption)


class SurveyCompletion(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE)
    date_completed = models.DateTimeField(auto_now_add=True)
