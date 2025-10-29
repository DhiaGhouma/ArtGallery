from rest_framework import serializers
from .models import Evaluation

class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = ['id', 'user', 'score', 'badge', 'description', 'date_evaluated']
        read_only_fields = ['score', 'badge', 'description', 'date_evaluated']
