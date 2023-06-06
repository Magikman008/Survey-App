from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .models import Color


@receiver(post_migrate)
def create_default_color(sender, **kwargs):
    if sender.name == 'myapp' and Color.objects.count() == 0:
        Color.objects.create(name='Стандартный цвет', hex_code='#ffffff', cost=0.00)
