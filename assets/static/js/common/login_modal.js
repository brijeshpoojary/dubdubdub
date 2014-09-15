(function() {
    var t = klp.login_modal = {};
    var postLoginCallback = null;
    t.open = function(callback) {
        postLoginCallback = callback;
        $('.js-login-modal').addClass('show');
    };

    t.close = function() {
        $('.js-login-modal').removeClass('show');
        postLoginCallback = null;
    };

    t.init = function() {
        $('#signupForm').submit(submitSignup);
        $('#signupFormSubmit').click(function(e) {
            e.preventDefault();
            $('#signupForm').submit();
        });
        $('#loginForm').submit(submitLogin);
        $('#loginFormSubmit').click(function(e) {
            e.preventDefault();
            $('#loginForm').submit();
        });

        $('.js-showLogin').click(showLogin);
    };

    function showLogin(e) {
        e.preventDefault();
        $('#signupContainer').hide();
        $('#loginContainer').show();
    }

    function submitSignup(e) {
        if (e) {
            e.preventDefault();
        }
        var formID = 'signupForm';
        klp.utils.clearValidationErrors(formID);
        var isValid = klp.utils.validateRequired(formID);
        if (isValid) {
            var fields = {
                'first_name': $('#signupFirstName'),
                'last_name': $('#signupLastName'),
                'mobile_no': $('#signupPhone'),
                'email': $('#signupEmail'),
                'password': $('#signupPassword')                
            };

            var data = {};
            _(_(fields).keys()).each(function(key) {
                data[key] = fields[key].val();
            });
            
            klp.utils.startSubmit(formID);
            var signupXHR = klp.api.signup(data);
            
            signupXHR.done(function(userData) {
                klp.utils.stopSubmit(formID);           
                klp.auth.loginUser(userData);
                if (postLoginCallback) {
                    postLoginCallback();
                }
                t.close();
            });

            signupXHR.fail(function(err) {
                //FIXME: deal with errors
                console.log("signup error", err);
                klp.utils.stopSubmit(formID);
                var errors = JSON.parse(err.responseText);
                if ('detail' in errors && errors.detail === 'duplicate email') {
                    var $field = fields.email;
                    klp.utils.invalidateField($field, "This email address already exists.");
                } else {
                    _(_(errors).keys()).each(function(errorKey) {
                        var errorMsg = errors[errorKey];
                        var $field = fields[errorKey];
                        klp.utils.invalidateField($field, errorMsg);
                    });
                }
                //alert("error signing up");
            });
        }
    }

    function submitLogin(e) {
        if (e) {
            e.preventDefault();
        }
        var formID = 'loginForm';
        var isValid = klp.utils.validateRequired('loginForm');
        if (isValid) {
            var data = {
                'email': $('#loginEmail').val(),
                'password': $('#loginPassword').val()
            };
            var loginXHR = klp.api.login(data);
            klp.utils.startSubmit(formID);
            loginXHR.done(function(userData) {
                klp.utils.stopSubmit(formID);
                userData.email = data.email;
                klp.auth.loginUser(userData);
                if (postLoginCallback) {
                    postLoginCallback();
                }
                t.close();
                //console.log("login done", postLoginCallback);

            });

            loginXHR.fail(function(err) {
                console.log("login error", err);
                klp.utils.stopSubmit(formID);
                var errors = JSON.parse(err.responseText);
                var $field = $('#loginPassword');
                if (errors.detail) {
                    klp.utils.invalidateField($field, errors.detail);
                }
            });
        }
    }

})();