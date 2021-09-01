let _debug_bypass_login = false;

let __DEFAULT_USER_INFO = {
    "name" : "No Name",
    "nick" : "No Nick",
    "pic"  : "./images/unknown_profile.jpg",
    "bio"  : "This person appears to have no history. M Night Shyamalan.",
    "homepage" : "www.google.com"
};

function login_init()
{
    //TODO figure out if this will work or undo variables due to race conditions
    //firebase.auth().onAuthStateChanged(empty_user_variables);
    //temp until above todo is done
    firebase.auth().onAuthStateChanged(function(user){
        if (!user) {
            unregister_firebase_listeners();
            empty_user_variables();
            reset_gui();
        }
    });

    
    navigation_setup(_debug_bypass_login);
    
    if (_debug_bypass_login)
    {
        attempt_login_with_email("jameszmonks@gmail.com", "monkey");
    }
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
    //auth.createUserWithEmailAndPassword(email, pass).catch(email_login_error);
    auth.signInWithEmailAndPassword(email, pass).then(successful_email_login).catch(email_login_error);
    
    function email_login_error(error) {
        console.log(error);
        
        reset_email_login_form(false);

        switch (error.code)
        {
        case "auth/wrong-password": $("#login-password-help").text("Password error"); 
                                    $("#login-password").addClass("is-invalid");
                                    break;
        case "auth/user-not-found": $("#login-email-help").text("E-mail not found"); 
                                    $("#login-email").addClass("is-invalid");
                                    break;
        case "auth/invalid-email" : $("#login-email-help").text("Please retype the e-mail"); 
                                    $("#login-email").addClass("is-invalid");
                                    break;
        }

    }

    async function successful_email_login(user)
    {
        console.log("successful_email_login");
        empty_user_variables();
        reset_email_login_form(true);
        hide_visible_modal();
        console.log("****got here");
        await populate_user_data();
        queued_view_profile_user_id = user_uid;
        show_modal_user_profile(null, view_user_profile_modal_prep);
    }
}

function attempt_signup_with_email(email, pass)
{
    console.log("attempt_signup_with_email", email, pass);
    try { auth.createUserWithEmailAndPassword(email, pass).then(  successful_signup ).catch( signup_failure ); }
    catch (error)
        { signup_failure(error); } //null arguments to auth function need a catch block
        
    function signup_failure(error = null) {
        console.log("signup_failure");
        console.log(error);
        switch(error.code)
        {
            case "auth/email-already-in-use" : 
                set_invalid("#signup-email-email", true);
                $("#signup-email-email-help").text("Email address already in use");
                break;
            case "auth/invalid-email" : 
                set_invalid("#signup-email-email", true);
                $("#signup-email-email-help").text(error.message);
                break;
            case "auth/weak-password" : 
                set_invalid("#signup-email-password", true);
                set_invalid("#signup-email-password2", true);
                $("#signup-email-password-help").text(error.message);
                $("#signup-email-password2-help").text(error.message);
                break;
            case "auth/argument-error" :
                console.log(error.message);
                break;
            case "auth/network-request-failed" :
                //TODO #3 Reload the page
                break;
            default : break;
        }
    }
    
    function successful_signup(user = null) {
        console.log("successful_signup");
        console.log(user);
        empty_user_variables();
        user_uid = auth.currentUser.uid;

        firebase_setup_new_user( user_login_complete, account_setup_failed );
    }
    
    function account_setup_failed(error) {
        //TODO #4 Account setup failed
        console.log("account_setup_failed");
        console.log("failed to initialize the user accounts variables");
        console.log(error);
    }
}

async function attempt_facebook_login(event = null)
{
    console.log("attempt_facebook_login");
    //TODO #5 Login failure
    let provider = new firebase.auth.FacebookAuthProvider();

    auth.signInWithPopup(provider).then((fb_login) => {
        console.log(fb_login.credential);
        console.log(fb_login.user);
        console.log(fb_login.credential.accessToken);

        console.log(fb_login.additionalUserInfo.isNewUser);

        empty_user_variables();
        user_uid = auth.currentUser.uid;

        if (fb_login.additionalUserInfo.isNewUser) {
            firebase_setup_new_user(user_login_complete /**, account failure here */);
            // .catch( account_setup_failed(error) );
        }
        else
        {
            user_login_complete();
        }
    }).catch(error_obj => {
        console.log(error_obj.code);

        switch (error_obj.code) {
            case "auth/account-exists-with-different-credential" :
                break;
            case "auth/auth-domain-config-required" :
                break;
            case "auth/credential-already-in-use" :
                break;
            case "auth/email-already-in-use" :
                break;
            case "auth/operation-not-allowed" :
                break;
            case "auth/operation-not-supported-in-this-environment" :
                break;
            case "auth/timeout" :
                break;
            default :
        }
    });
}

//TODO #6 Add github login feature
function attempt_github_login(event = null)
{
    console.log("attempt_github_login");
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

{/**
 * Transitions
 * USE CASE 1
 * modal exists
 * it is :visible, shown, show or hide                                  function modal_exists
 * if it is showing, need to listen for shown, then start hiding        if function modal_state() == "showing"
 *                                                                          on(shown.bs.modal, hide_current_modal)
 * if it is hiding, need to listen for hidden, then load next modal     if function modal_state() == "hiding"
 *                                                                          on(hidden.bs.modal, show_next_modal)
 * if it is not in transition, then load next modal                     if function modal_state() == "shown"
 *                                                                          .modal("show")
 * **** NB CSS transitions don't have or need intermediate animation states in bootstrap modals
*/}

/**
 * Once a user has logged in and been validated, setup local variables
 */
async function populate_user_data()
{
    console.log("populate_user_data");
    user_uid = auth.currentUser.uid;
    console.log(user_uid);
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
    show_modal_user_profile(null, view_user_profile_modal_prep);
}

function toggle_persistence(event) {
    let _p_local = firebase.auth.Auth.Persistence.LOCAL;
    let _p_none =  firebase.auth.Auth.Persistence.NONE;

    // auth.setPersistence(_p_local);
}