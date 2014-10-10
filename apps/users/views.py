from django.views.generic.detail import DetailView
from django.views.generic.base import RedirectView
from django.http import Http404
from django.shortcuts import redirect, get_object_or_404
from common.views import StaticPageView
from django.core.urlresolvers import reverse
from models import User, Organization, VolunteerActivity, VolunteerActivityType

class ProfilePageView(DetailView):
    model = User
    template_name = 'profile.html'

    def get_context_data(self, **kwargs):
        context = super(ProfilePageView, self).get_context_data(**kwargs)
        user = context['object']
        context['breadcrumbs'] = [
            {
                'url': '/profile/%d' % (user.id,),
                'name': 'Profile: %s %s' % (user.first_name, user.last_name,)
            }
        ]
        return context



class EmailVerificationView(StaticPageView):
    template_name = 'email_verified.html'

    def get(self, request, **kwargs):
        email_verification_code = self.request.GET.get('token', '')
        email = self.request.GET.get('email', '')

        users = User.objects.filter(
            is_email_verified=False,
            email=email,
            email_verification_code=email_verification_code
        )
        if users.count() == 1:
            user = users[0]
            user.is_email_verified = True
            user.save()
        else:
            raise Http404()

        return super(EmailVerificationView, self).get(request, **kwargs)


class OrganizationSlugPageView(DetailView):
    model = Organization
    slug_field = 'slug'
    slug_url_kwargs = 'slug'
    template_name = 'organization.html'

    def get_context_data(self, **kwargs):
        context = super(OrganizationSlugPageView, self).get_context_data(**kwargs)
        org = context['object']
        context['breadcrumbs'] = [
            {
                'url': '/organisation/%d' % (org.id,),
                'name': 'Organisation: %s' % (org.name,)
            }
        ]
        return context


class OrganizationPKPageView(RedirectView):
    permanent = True
    query_string = True
    pattern_name = 'article-detail'

    def get_redirect_url(self, *args, **kwargs):
        org = get_object_or_404(Organization, pk=kwargs['pk'])
        if not org.slug:
            org.save()
        return reverse('organization_page_slug', kwargs={'slug': org.slug})


class ProfileEditPageView(DetailView):
    model = User
    template_name = 'profile_edit.html'

    def get_context_data(self, **kwargs):
        context = super(ProfileEditPageView, self).get_context_data(**kwargs)
        user = context['object']
        context['breadcrumbs'] = [
            {
                'url': '/profile/%d' % (user.id,),
                'name': 'Profile'
            },
            {
                'url': '/profile/%d/edit' % (user.id,),
                'name': 'Edit'
            }
        ]
        return context


class OrganizationEditPageView(DetailView):
    model = Organization
    template_name = 'organization_edit.html'

    def get_context_data(self, **kwargs):
        context = super(OrganizationEditPageView, self).get_context_data(**kwargs)
        org = context['object']
        context['breadcrumbs'] = [
            {
                'url': '/organisation/%d' % (org.id,),
                'name': 'Organisation: %s' % (org.name,)
            },
            {
                'url': '/organisation/%d/edit' % (org.id,),
                'name': 'Edit'
            }
        ]
        return context


class VolunteerActivityAddPageView(DetailView):
    model = Organization
    template_name = 'volunteeractivity/add.html'

    def get_context_data(self, **kwargs):
        context = super(VolunteerActivityAddPageView, self).get_context_data(**kwargs)
        context['action'] = 'Add'
        context['activity_types'] = VolunteerActivityType.objects.all()
        org = context['object']
        context['breadcrumbs'] = [
            {
                'url': '/organisation/%d' % (org.id,),
                'name': 'Organisation: %s' % (org.name,)
            },
            {
                'url': '/organisation/%d/edit' % (org.id,),
                'name': 'Edit'
            },
            {
                'url': '/organisation/%d/volunteer_activity' % (org.id,),
                'name': 'Add Volunteer Activity'
            },
        ]
        return context


class VolunteerActivityEditPageView(DetailView):
    model = VolunteerActivity
    template_name = 'volunteeractivity/edit.html'

    def get_context_data(self, **kwargs):
        context = super(VolunteerActivityEditPageView, self).get_context_data(**kwargs)
        context['action'] = 'Edit'
        context['activity_types'] = VolunteerActivityType.objects.all()
        activity = context['object']
        org = activity.organization
        context['breadcrumbs'] = [
           {
                'url': '/organisation/%d' % (org.id,),
                'name': 'Organisation: %s' % (org.name,)
            },
            {
                'url': '/organisation/%d/edit' % (org.id,),
                'name': 'Edit'
            },
            {
                'url': '/organisation/%d/volunteer_activity/%d' % (org.id, activity.id,),
                'name': 'Edit Volunteer Activity'
            }
        ]
        return context


class VolunteerMapPageView(StaticPageView):

    def get_context_data(self, **kwargs):
        context = super(VolunteerMapPageView, self).get_context_data(**kwargs)
        context['activity_types'] = VolunteerActivityType.objects.all()
        context['organizations'] = Organization.objects.all()
        return context
