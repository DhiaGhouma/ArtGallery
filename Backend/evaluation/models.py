from django.db import models

from django.db import models
from django.contrib.auth.models import User

class Evaluation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='evaluations')
    score = models.FloatField(default=0)
    badge = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    date_evaluated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.badge or 'Unranked'}"
