import django_filters

from .models import Question, Questiongroup

class QuestionFilter(django_filters.FilterSet):
    source = django_filters.MethodFilter(action='source_filter')
    type = django_filters.MethodFilter(action='question_type_filter')

    class Meta:
        model = Question
        fields = ['text', 'type', 'source']

    def source_filter(self, queryset, value):
        return queryset.filter(
            questiongroup__source__name=value
        )

    def question_type_filter(self, queryset, value):
        return queryset.filter(
            question_type__name=value
        )

class QuestiongroupFilter(django_filters.FilterSet):
    class Meta:
        model = Questiongroup
        fields = ['status']
