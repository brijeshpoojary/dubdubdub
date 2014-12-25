from django.conf.urls import patterns, include, url
from django.conf import settings
from django.views.generic import TemplateView
from django.views.generic.base import RedirectView
from django.contrib import admin
admin.autodiscover()
from schools.views import SchoolPageView
from common.views import StaticPageView
from users.views import (ProfilePageView, OrganizationSlugPageView,
    OrganizationPKPageView, ProfileEditPageView, OrganizationEditPageView,
    VolunteerActivityAddPageView, VolunteerActivityEditPageView,
    EmailVerificationView, VolunteerMapPageView, DonatePageView,
    DonationRequirementsView, DonationRequirementAddEditPageView)

urlpatterns = patterns(
    '',

    # home page
    url(r'^$', StaticPageView.as_view(
        template_name='home.html',
        extra_context={
            # anything put into this dict will be availabe in template
            'homepage': True
            }
        ), name='home'),

    # about pages
    url(r'^about/$', StaticPageView.as_view(
        template_name='aboutus.html',
        extra_context={
            'breadcrumbs': [
                {
                    'url': '/about',
                    'name': 'About'
                }
            ]
        }
        ), name='aboutus'),
    url(r'text/aboutus/$', RedirectView.as_view(url='/about')),

    url(r'^partners/$', StaticPageView.as_view(
        template_name='partners.html',
        extra_context={
            'breadcrumbs': [
                {
                    'url': '/partners',
                    'name': 'Partners'
                }
            ]
        }
        ), name='partners'),
    url(r'text/partners/$', RedirectView.as_view(url='/partners')),

    url(r'^disclaimer/$', StaticPageView.as_view(
        template_name='disclaimer.html',
        extra_context={
            'breadcrumbs': [
                {
                    'url': '/disclaimer',
                    'name': 'Disclaimer'
                }
            ]
        }
        ), name='disclaimer'),
    url(r'text/disclaimer/$', RedirectView.as_view(url='/disclaimer')),

    # reports page
    url(r'^reports/$', StaticPageView.as_view(
        template_name='reports.html',
        extra_context={
            'breadcrumbs': [
                {
                    'url': '/reports',
                    'name': 'Reports'
                }
            ]
        }
        ), name='reports'),
    url(r'text/reports/$', RedirectView.as_view(url='/reports')),

    # data page
    url(r'^data/$', StaticPageView.as_view(
        template_name='data.html',
        extra_context={
            'breadcrumbs': [
                {
                    'url': '/data',
                    'name': 'Data'
                }
            ]
        }
        ), name='data'),
    url(r'text/data$', RedirectView.as_view(url='/data')),
    url(r'listFiles/2$', RedirectView.as_view(url='/data')),

    # programme pages
    url(r'^programmes/reading/$', StaticPageView.as_view(
        template_name='reading_programme.html',
        extra_context={
            'breadcrumbs': [
                {
                    'url': '/programmes/reading',
                    'name': 'Reading Programme'
                }
            ]
        }
        ), name='reading_programme'),
    url(r'text/reading/$', RedirectView.as_view(url='/programmes/reading')),

    url(r'^text/maths/$', StaticPageView.as_view(
        template_name='maths_programme.html',
        extra_context={
            'breadcrumbs': [
                {
                    'url': '/text/maths',
                    'name': 'Maths Programme'
                }
            ]
        }
        ), name='maths_programme'),

    url(r'^text/library/$', StaticPageView.as_view(
        template_name='library_programme.html',
        extra_context={
            'breadcrumbs': [
                {
                    'url': '/text/library',
                    'name': 'Library Programme'
                }
            ]
        }
        ), name='library_programme'),

    url(r'^text/preschool/$', StaticPageView.as_view(
        template_name='preschool_programme.html',
        extra_context={
            'breadcrumbs': [
                {
                    'url': '/text/preschool',
                    'name': 'Preschool Programme'
                }
            ]
        }
        ), name='preschool_programme'),

    url(r'^programmes/sikshana/$', StaticPageView.as_view(
        template_name='sikshana_programme.html',
        extra_context={
            'breadcrumbs': [
                {
                    'url': '/programmes/sikshana',
                    'name': 'Sikshana Programme'
                }
            ]
        }
        ), name='sikshana_programme'),

    url(r'text/sikshana/$', RedirectView.as_view(url='/programmes/sikshana')),

    url(r'^volunteer/$', StaticPageView.as_view(
        template_name='volunteer.html',
        extra_context={
            'breadcrumbs': [
                {
                    'url': '/volunteer',
                    'name': 'Volunteer'
                }
            ]
        }
        ), name='volunteer'),
    url(r'text/volunteer/$', RedirectView.as_view(url='/volunteer/')),

    url(r'^volunteer-register/$', StaticPageView.as_view(
        template_name='volunteer-register.html',
        ), name='volunteer_register'),

    url(r'^map/$', StaticPageView.as_view(
        template_name='map.html',
        extra_context={
            'header_full_width': True,
            'header_fixed': True,
            'hide_footer': True,
            'breadcrumbs': [
                {
                    'url': '/map',
                    'name': 'Map'
                }
            ]
        }), name='map'),


    # url(r'^volunteer-map$', StaticPageView.as_view(
    #     template_name='volunteer-map.html',
    #     extra_context={
    #         'header_full_width': True,
    #         'header_fixed': True,
    #         'hide_footer': True
    #     }), name='volunteer_map'),

    url(r'^volunteer-map$', VolunteerMapPageView.as_view(
        template_name='volunteer-map.html',
        extra_context={
            'header_full_width': True,
            'header_fixed': True,
            'hide_footer': True,
            'breadcrumbs': [
                {
                    'url': '/volunteer',
                    'name': 'Volunteer'
                },
                {
                    'url': '/volunteer-map',
                    'name': 'Activities'
                }
            ]
        }), name='volunteer_map'),

    url('^donate$', DonatePageView.as_view(
        template_name = 'donate/donate.html',
        extra_context={
            'breadcrumbs': [
                {
                    'url': '/donate',
                    'name': 'Donate'
                }
            ]
        }), name='donate'),

    url('^donate/requests/', DonationRequirementsView.as_view(
        template_name = 'donate/donate_requests.html'
        ), name='donate_requests'),

    url(r'^organisation/(?P<pk>[0-9]+)/donation_requirement$',
        DonationRequirementAddEditPageView.as_view(
            extra_context = {
                'action': 'Add'
            }
        ),
        name='donationrequest_add_page'),

    url(r'^organisation/(?P<org_pk>[0-9]+)/donation_requirement/(?P<pk>[0-9]+)$',
        DonationRequirementAddEditPageView.as_view(
            extra_context = {
                'action': 'Edit'
            }
        ),
        name='volunteeractivity_edit_page'),

    url(r'^school/(?P<pk>[0-9]+)/$',
        SchoolPageView.as_view(), name='school_page'),

    url(r'^schoolpage/school/(?P<pk>[0-9]*)$$', RedirectView.as_view(
        pattern_name='school_page',
        query_string=True
    ), name='old_school_page'),

    url(r'^users/verify_email',
        EmailVerificationView.as_view(), name='user_email_verify'),

    url(r'^profile/(?P<pk>[0-9]+)/$',
        ProfilePageView.as_view(), name='profile_page'),

    url(r'^organisation/(?P<pk>[0-9]+)/$',
        OrganizationPKPageView.as_view(), name='organization_page'),
    url(r'^organisation/(?P<slug>[-a-zA-Z0-9_]+)/$',
        OrganizationSlugPageView.as_view(), name='organization_page_slug'),

    url(r'^organisation/(?P<pk>[0-9]+)/edit$',
        OrganizationEditPageView.as_view(),
        name='organization_edit_page'),

    url(r'^organisation/(?P<pk>[0-9]+)/volunteer_activity$',
        VolunteerActivityAddPageView.as_view(),
        name='volunteeractivity_add_page'),

    url(r'^organisation/(?P<org_pk>[0-9]+)/volunteer_activity/(?P<pk>[0-9]+)$',
        VolunteerActivityEditPageView.as_view(),
        name='volunteeractivity_edit_page'),

    url(r'^profile/(?P<pk>[0-9]+)/edit$',
        ProfileEditPageView.as_view(), name='profile_edit_page'),

    url(r'^password-reset/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/$',
        'django.contrib.auth.views.password_reset_confirm', {
            'template_name': 'users/password-reset-confirm.html'
        }, name='password_reset_confirm'),

    url(r'^password-reset/done/$',
        'django.contrib.auth.views.password_reset_complete', {
            'template_name': 'users/password-reset-complete.html'
        },
        name='password_reset_complete'),

    url(r'^blog-feed$', 'schools.views.blog_feed', name='blog_feed'),

    url(r'^admin/', include(admin.site.urls)),

    url(r'^api/v1/', include('dubdubdub.api_urls')),
    url(r'^api/docs/', include('rest_framework_swagger.urls')),
)

if settings.DEBUG:
    urlpatterns += patterns(
        '',
        url(r'^media/(?P<path>.*)$', 'django.views.static.serve', {
            'document_root': settings.MEDIA_ROOT,
        }),
        url(r'^favicon\.ico$', 'django.views.static.serve', {
            'url': '/static/images/favicon.ico'
        }),
    )
