let _SIGNUP_WITH_EMAIL_ = "createUserWithEmailAndPassword";
let _SIGNIN_WITH_EMAIL_ = "signInWithEmailAndPassword";
let _SIGNIN_WITH_POPUP_ = "signInWithPopup";

let _debug_bypass_login = false;
let _auto_login = null;
let _new_user = false;
let _latest_login_source = "none";

let _time_offset = 0;

let __DEFAULT_USER_INFO = {
    "name" : "Enter your chat name",
    "nick" : "Enter your chat nick",
    "pic"  : "./images/unknown_profile.jpg",
    "bio"  : "Enter your chat bio here",
    "homepage" : "Enter your homepage here"
};

async function login_init()
{
    firebase.auth().onAuthStateChanged(new_auth_login);
    
    if (_debug_bypass_login)
    {
        attempt_login_with_email("jameszmonks@gmail.com", "monkey");
    }
}

function received_login_request(event)
{
    console.log(event.currentTarget.id);
    switch (event.currentTarget.id)
    {
        case "nav-email-login" :
            show_modal_login_email();
            break;
        case "nav-facebook-login" : 
            attempt_facebook_login();
            break;
        case "nav-github-login": 
            attempt_github_login();
            break;
        case "nav-guest-login": 
            attempt_guest_login();
            break;
        default :
            console.log(event.currentTarget);
            console.log(event.currentTarget.id);    
    }
}

async function new_auth_login(user)
{
    console.log("authstatechanged");
    let user_loggedin = Boolean(user != null);
    
    //TODO #22 auto_login multi-user
    // *, user logout && different user login => _auto_login should be false

    //if the user clicks on the login button, _auto_login is set to false
    //_auto_login is only null here if the user has not attempted to login
    if (_auto_login === null && user_loggedin)
        _auto_login = true;
    
    auto_set_persistence();
    if (_auto_login === null)
        console.log("new_auth_login _auto_login is null, what made this happen?");
    else if (_auto_login == true)
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    else if (_auto_login == false)
        auth.setPersistence(firebase.auth.Auth.Persistence.NONE);

    //if not email login, is this user a new user?
    if (user_loggedin)
        if (user.additionalUserInfo)
            console.log(_new_user = user.additionalUserInfo.isNewUser);
    
    console.log(user_loggedin, _new_user);

    //actual login function follows
    clear_previous_session();
    if (user_loggedin)
    {
        let success = await setup_current_user_vars();
        if (success)
        {
            navigation_setup(true);
            queued_view_profile_user_id = user_uid;
            show_modal_user_profile(); //default behaviour is to load user profile
            chatbot_init();
        }
        else
        {
            firebase.auth().signOut();
            show_error_modal("Signin error", "There was an internal sign in error.<br>Please refresh the page and try again.");
        }
    }
    else
        navigation_setup(false);
}

function clear_previous_session()
{
    unregister_firebase_listeners();
    empty_user_variables();
    reset_gui();
    reset_email_login_form(true);//unnecessary for other than email login, but won't break anything
    reset_signup_email_form(true);//unnecessary for other than email signup, but won't break anything
}

async function setup_current_user_vars()
{
    user_uid = auth.currentUser.uid;
    let success = true;
    //TODO #4 Account setup failed
    if (_new_user)
        await firebase_setup_new_user().catch(error => { success = false; });
    if (success)
        await populate_user_data().catch(error => { success = false; });
    return success;
}

/********************
*  LOGIN FUNCTIONS  *
********************/

//TODO #2 Enable altering of user persistence and use this state on page landing
function attempt_last_login(event = null)
{
    console.log("attempt_last_login");
}

function login_with_email_event(event = null)
{
    if (event)
    {
        event.preventDefault();
        
        console.log($("#login-email").val());
        console.log($("#login-password").val());
    }  
    let email = $("#login-email").val();
    let pass = $("#login-password").val();
    attempt_login_with_email(email, pass);
}

function signup_with_email_event(event = null)
{
    reset_signup_email_form();
    console.log("signup_with_email_event");
    let email = $("#signup-email-email");
    let pass1 = $("#signup-email-password");
    let pass2 = $("#signup-email-password2");

    if (pass1.val() === pass2.val())
    {  
        console.log("equals");
        set_invalid(pass1, false);
        set_invalid(pass2, false);
        attempt_signup_with_email(email.val(), pass1.val());
    }
    else
    {
        console.log("not_equals");
        $("#signup-email-password-help").text("Passwords do not match");
        $("#signup-email-password2-help").text("Passwords do not match");
        set_invalid("#signup-email-password", true);
        set_invalid("#signup-email-password2", true);
    }
}

function attempt_login_with_email(email, pass)
{
    console.log("attempt_login_with_email", email, pass);
    _new_user = false;
    auth.signInWithEmailAndPassword(email, pass).catch( error => {
        login_error_handler(_SIGNIN_WITH_EMAIL_, error);
    });
}

function attempt_signup_with_email(email, pass)
{
    console.log("attempt_signup_with_email", email, pass);
    _new_user = true;
    auth.createUserWithEmailAndPassword(email, pass).catch( error => {
        login_error_handler(_SIGNUP_WITH_EMAIL_, error);
    });
}

async function attempt_facebook_login(event = null)
{
    console.log("attempt_facebook_login");
    //TODO #5 Login failure
    let provider = new firebase.auth.FacebookAuthProvider();

    auth.signInWithPopup(provider).catch(
        error_obj => {
        console.log(error_obj.code);
        switch (error_obj.code) {
            case "auth/account-exists-with-different-credential" :
                break;
            case "auth/auth-domain-config-required" :
                break;
            case "auth/email-already-in-use" :
                break;
            case "auth/operation-not-allowed" :
                break;
            case "auth/operation-not-supported-in-this-environment" :
                break;
                default :
        }
    });
}

//TODO #6 Add github login feature
function attempt_github_login(event = null)
{
    let provider = new firebase.auth.GithubAuthProvider();
    auth.signInWithPopup(provider).catch(error_obj => {
        console.log(error_obj)
    });
    console.log("attempt_github_login");
}

function login_error_handler(source, error)
{
    let err_code = error.code;
    let err_message = error.message;
    console.log("login_error_handler");
    console.log(source, error)

    if (source == _SIGNIN_WITH_EMAIL_)
        reset_email_login_form(false);
    else if (source == _SIGNUP_WITH_EMAIL_)
        reset_signup_email_form(false);

    switch (err_code)
    {
        case "auth/email-already-in-use" : 
            //called by createUserWithEmailAndPassword -> attempt_signup_with_email
            set_invalid("#signup-email-email", true);
            $("#signup-email-email-help").text("Email address already in use");
            break;

        case "auth/invalid-email" : 
            //Thrown if the email address is not valid.
            //called by createUserWithEmailAndPassword -> attempt_signup_with_email
            if (source == _SIGNUP_WITH_EMAIL_)
            {
                set_invalid("#signup-email-email", true);
                $("#signup-email-email-help").text(err_message);
            }
            //called by signInWithEmailAndPassword -> attempt_login_with_email()
            else if (source == _SIGNIN_WITH_EMAIL_)
            {
                set_invalid("#login-email", true);
                $("#login-email-help").text("Please retype the e-mail"); 
            }
            break;

        case "auth/weak-password" : //signup with email and password
            //called by createUserWithEmailAndPassword -> attempt_signup_with_email
            set_invalid("#signup-email-password", true);
            set_invalid("#signup-email-password2", true);
            $("#signup-email-password-help").text(err_message);
            $("#signup-email-password2-help").text(err_message);
            break;

        case "auth/network-request-failed" :
            //Thrown if a network error (such as timeout, interrupted connection or unreachable host) has occurred.
            show_error_modal("Network error", "A network error has occurred, if the error persists please try again later");
            break;

        case "auth/user-disabled" :
            //Thrown if the user corresponding to the given email has been disabled.
            //called by signInWithEmailAndPassword -> attempt_login_with_email()
            show_error_modal("Account disabled", err_message);
            break;

        case "auth/user-not-found" :
            //Thrown if there is no user corresponding to the given email.
            //called by signInWithEmailAndPassword -> attempt_login_with_email()
            $("#login-email-help").text("E-mail not found"); 
            $("#login-email").addClass("is-invalid");
            break;

        case "auth/wrong-password" :
            //Thrown if the password is invalid for the given email, or the account corresponding to the email does not have a password set.
            //called by signInWithEmailAndPassword -> attempt_login_with_email()
            $("#login-password-help").text("Password error");
            set_invalid("#login-password", true);
            break;

        case "auth/cancelled-popup-request" :
            //Thrown if successive popup operations are triggered. Only one popup request is allowed at one time. All the popups would fail with this error except for the last one.
            //called by signInWithPopup -> multiple
            //DO NOTHING
            break;

        case "auth/popup-blocked" :
            //Thrown if the popup was blocked by the browser, typically when this operation is triggered outside of a click handler.
            //called by signInWithPopup -> multiple
            show_error_modal("Popup error", "The popup is unable to be shown.<br>This could be a result a browser's popup blocker");
            break;

        case "auth/popup-closed-by-user" :
            //Thrown if the popup window is closed by the user without completing the sign in to the provider.
            //called by signInWithPopup -> multiple
            show_error_modal("Popup error", "The user has closed the popup before authentication could proceed.");
            break;

        case "auth/timeout" :
            show_error_modal("Timeout", "The site took too long to respond.");
            break;

        case "auth/account-exists-with-different-credential" :
            //Thrown if there already exists an account with the email address asserted by the credential. Resolve this by calling firebase.auth.Auth.fetchSignInMethodsForEmail with the error.email and then asking the user to sign in using one of the returned providers. Once the user is signed in, the original credential retrieved from the error.credential can be linked to the user with firebase.User.linkWithCredential to prevent the user from signing in again to the original provider via popup or redirect. If you are using redirects for sign in, save the credential in session storage and then retrieve on redirect and repopulate the credential using for example firebase.auth.GoogleAuthProvider.credential depending on the credential provider id and complete the link.
            //called by signInWithPopup -> multiple
        case "auth/credential-already-in-use" :
            show_error_modal("Account exists", "This profile is already linked to an account!<br>Please log in to the other account.");
            break;
            
            /** The following are developer errors */
        case "auth/argument-error" :
            //Thrown if a method is called with incorrect arguments
        case "auth/auth-domain-config-required" :
            //Thrown if authDomain configuration is not provided when calling firebase.initializeApp(). Check Firebase Console for instructions on determining and passing that field.
            //called by signInWithPopup -> multiple
        case "auth/operation-not-allowed" :
            //Thrown if the type of account corresponding to the credential is not enabled. Enable the account type in the Firebase Console, under the Auth tab.
            //called by createUserWithEmailAndPassword -> attempt_signup_with_email
            //called by signInWithPopup -> multiple
        case "auth/operation-not-supported-in-this-environment" :
            //Thrown if this operation is not supported in the environment your application is running on. "location.protocol" must be http or https.
            //called by signInWithPopup -> multiple
        case "auth/unauthorized-domain" :
            //Thrown if the app domain is not authorized for OAuth operations for your Firebase project. Edit the list of authorized domains from the Firebase console.
            //called by signInWithPopup -> multiple
            show_error_modal("Dev Error", `${err_code} <br> ${err_message}`);
            break;
    }
}

function show_error_modal(title, body)
{
    remove_allow_empty_children("#error-modal", true);
    $("#error-modal-title").html(title);
    $("#error-modal-body").html(body);
    show_modal("#error-modal");
}

function reset_email_login_form(clear_text = false)
{
    console.log("reset_email_login_form");
    $("#login-email-help").text("Please enter the e-mail you used to sign up.");
    $("#login-email").removeClass("is-invalid");
    $("#login-password-help").text("(Not the password for your email)");
    $("#login-password").removeClass("is-invalid");

    if (clear_text)
    {
        $("#login-email").val("");
        $("#login-password").val("");
    }
}

function reset_signup_email_form(clear_text = false)
{
    $("#signup-email-email-help").text("Please enter your e-mail address");
    $("#signup-email-password-help").text("Create a password");
    $("#signup-email-password2-help").text("Re-enter your password");
    set_invalid("#signup-email-email", false);
    set_invalid("#signup-email-password", false);
    set_invalid("#signup-email-password2", false);

    if (clear_text)
    {
        $("#signup-email-email").val("");
        $("#signup-email-password").val("");
        $("#signup-email-password2").val("");
    }
}

function set_invalid(dom_elem, is_invalid = true)
{
    console.log(typeof dom_elem === "string");
    if (typeof dom_elem === "string")
        dom_elem = (dom_elem.indexOf("#") == -1) ? "#" + dom_elem: dom_elem;
    if (dom_elem instanceof jQuery)
    {
        if (dom_elem.length)
            for (let i=0; i < dom_elem.length; i++)
                set_invalid(dom_elem[i], is_invalid);
            //return;
        //else
        //    return;
        return;
    }
    console.log("set_invalid", dom_elem, is_invalid);

    if (dom_elem instanceof Element || typeof dom_elem === "string")
    {
        console.log("elem or string == true");
        console.log($(dom_elem));
        if ($(dom_elem).hasClass("is-invalid"))
        {
            console.log("has is-invalid");
            if (!is_invalid) 
                $(dom_elem).removeClass("is-invalid");
        }
        else{
            console.log("does not have is-invalid");
            if (is_invalid)
                $(dom_elem).addClass("is-invalid")
        }
    }
}

/**
 * Once a user has logged in and been validated, setup local variables
 */
async function populate_user_data()
{
    console.log("populate_user_data");
    user_uid = auth.currentUser.uid;
    console.log(user_uid);
    database.ref(`/.info/serverTimeOffset`).once("value", time_snapshot => {
        _time_offset = time_snapshot.val();
    });
    let snapshot = await database.ref("/users/" + user_uid).once("value");

    // function ref_call(snapshot)
    // {
    let user_root = snapshot.val();
    user_info = user_root["info"];
    if (user_info == null)
    {
        throw new Error("user_info isn't meant to be empty under any login circumstance");
    }
    //firebase doesn't store empty sets, so accessing these variables will return 'undefined' in the
    //case of an empty set
    user_rooms =    (user_root["rooms"])          ? user_root["rooms"] : [];
    user_contacts = (user_root["contacts"])       ? user_root["contacts"] : [];
    user_tokens =   (user_root["invite_tokens"])  ? user_root["invite_tokens"] : [];
    console.log(user_root);
    console.log(user_info);
    console.log(user_rooms);
    console.log(user_contacts);
    console.log(user_tokens);
    init_user();
    // }
}

/**
 * On a succesful change to auth credentials, this function should be called.
 */
function empty_user_variables()
{
    console.log("empty_user_variables");
    //local storage of firebase user info
    user_uid = user_info = user_contacts = user_tokens = user_rooms = null;

    //local storage of users encountered
    current_roomid = "";
    room_info = {};
    user_profiles = {};
    queued_view_profile_user_id = "";
}

async function user_login_complete(obj) {
    console.log("account_setup_successful", obj);
    await populate_user_data();
    queued_view_profile_user_id = user_uid;
    show_modal_user_profile();
}

function toggle_persistence(event) {
    event.stopPropagation();
    event.preventDefault();

    if (_auto_login === true)
        _auto_login = false;
    else if (_auto_login === false)
        _auto_login = true;
    auto_set_persistence();
}

function auto_set_persistence()
{
    console.log("auto_set_persistence", _auto_login);
    let selector = "#nav-toggle-persistence #persistence-toggler";
    if (_auto_login === true)
    {
        console.log(true);
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        $(selector).addClass("persistence-on");
    }
    if (_auto_login === false)
    {
        console.log(false);
        auth.setPersistence(firebase.auth.Auth.Persistence.NONE);
        $(selector).removeClass("persistence-on");
    }
    console.log("toggle toggle toggel");
}

function logout(event) {
    firebase.auth().signOut();
}

function signout(event) {
    firebase.auth().signOut();
}