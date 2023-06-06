from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.db import models


class Color(models.Model):
    name = models.CharField(max_length=30)
    hex_code = models.CharField(max_length=7)
    cost = models.IntegerField(default=0, validators=[MinValueValidator(0)])


class UserMarket(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    balance = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    purchased_colors = models.ManyToManyField('Color', related_name='users')
    active_color = models.ForeignKey(Color, on_delete=models.CASCADE, default=1)


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
