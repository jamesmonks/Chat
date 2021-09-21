console.log("loaded external code_playground.js");

//keys for firebase /user/info as well as keys for user_profiles
let __USER_INFO_NAME__ = "name";
let __USER_INFO_NICK__ = "nick";
let __USER_INFO_PIC__ = "pic";
let __USER_INFO_BIO__ = "bio";
let __USER_INFO_HOME__ = "homepage";
//keys for users in user_profiles object  user_profiles.user_id.key
let __USER_PROFILE_CSS__ = "css_class_name";
let __USER_PROFILE_COLOR__ = "color";

let __DEFAULT_PROFILE_IMAGE_LINK__ = "./images/unknown_profile.jpg";
let __DEFAULT_ROOM_IMAGE_LINK__ = "./images/empty-round-room.jpg";

//for currently viewed user profile
let queued_view_profile_user_id = "";

//local storage of firebase user info
var user_uid;
let user_info;
let user_contacts;
let user_tokens;
let user_rooms;

//local storage of users encountered
let user_profiles = {};

// firebase variables
var database;
var auth;

async function prep(event)
{
    
    //dummy_data();
    user_info = {};

    setup_navigation_listeners();
    init_modal_button_functions();

    connect_to_firebase();

    $("#chat-input-row").hide();
    $("#send-user-message").on("click", send_message_event).hide();
    $("#user-message-text").on("keypress", event => {
        if (event.key === 'Enter')
        {
            send_message_event(event);
        }
    });
    $("#user-message-text").on("click", clear_message_text).hide();
    $("#sign-in-method-button").on("click", event => {
        _auto_login = false;
    });
    $("#show-create-room-modal-button").on("click", create_room).hide();

    await login_init();

    $(`#welcomeModal`).modal(`show`);
    $(`.navbar-brand`).on("click", event => { $(`#welcomeModal`).modal(`show`) });

    window.onresize = do_breakpoint_change_detection;
    document.addEventListener(BOOTSTRAP_BREAKPOINT_CHANGE_EVENT, scroll_to_last_row);
}

/**
 * Function adds the user and the data associated with the user_id to the system with all
 * associated styling.
 * @param {string} user_id System generated unique id
 * @param {string} user_name An alias defined by the user of the user_id
 * @param {*} nickname 
 * @param {*} profile_pic_link 
 * @param {*} bio_info 
 * @param {*} homepage_link 
 * @returns {*} Returns nothing
 */
function add_user_profile(  user_id, user_name, nickname = null, profile_pic_link = null, bio_info = null, homepage_link = null )
{
    console.log("add_user_profile", user_id, user_name);
    if (user_profiles.hasOwnProperty(user_id))
    {
        populate_profile_parameters(user_profiles[user_id], user_name, nickname, profile_pic_link, bio_info, homepage_link, null, null);
        if ( user_id == user_uid )
        {
            //update local parameters for the user
            console.log("*******************");
            console.log("add_user_profile user is current user alert");
            console.log("*******************");
        }
        return;
    }

    let next_color = create_next_user_color();
    let obj = populate_profile_parameters({}, user_name, nickname, profile_pic_link, bio_info, homepage_link, 
                                          next_color, "user_" + user_id.toString());

    user_profiles[user_id] = obj;

    create_user_style(user_id);
}

/**
 * This function takes care of creating or amending a profile, taking into account default values for the objects
 * in the user_profile variable.
 * @param {*} obj The object that will have all the key value pairs added to
 * @param {*} user_name The user_name that is passed
 * @param {*} nickname The user nickname that is passed
 * @param {*} profile_pic_link The link to the profile picture
 * @param {*} bio_info The submitted profile bio
 * @param {*} homepage_link The link to the user's homepage
 * @param {*} profile_color The color assigned to the user for this session
 * @param {*} profile_css_name The CSS classname for this user in this session
 */
function populate_profile_parameters(obj, user_name, nickname = null, profile_pic_link = null, 
    bio_info = null, homepage_link = null, profile_color = null, profile_css_name = null )
{
    if (obj == null)
        obj = {};
    
    populate_object_field(obj, __USER_INFO_NAME__,      user_name,          "No name");
    populate_object_field(obj, __USER_INFO_NICK__,      nickname,           "No_Nick");
    populate_object_field(obj, __USER_INFO_PIC__ ,      profile_pic_link,   __DEFAULT_PROFILE_IMAGE_LINK__);
    populate_object_field(obj, __USER_INFO_BIO__ ,      bio_info,           "No bio");
    populate_object_field(obj, __USER_INFO_HOME__,      homepage_link,      "");
    populate_object_field(obj, __USER_PROFILE_COLOR__,  profile_color,      "");
    populate_object_field(obj, __USER_PROFILE_CSS__,    profile_css_name,   "");

    return obj;
}

/**
 * Function populates an object's key making sure not to fill it with null or "" values unless it's
 * defined as a default value
 * @param {*} obj The object the key belongs or will belong to
 * @param {*} key The key of the object to be filled
 * @param {*} value The value passed for the key
 * @param {*} default_value The fallback value if value is null or ""
 * @returns Nothing
 */
function populate_object_field(obj, key, value, default_value)
{
    if (value == null && obj.hasOwnProperty(key)) 
        return;
    if (value == null || value == "")
    {
        obj[key] = default_value;
        return;
    }
    obj[key] = value;
    return;
}



//EDITING BELOW HERE

//FROM INDEX.JS
function init_user(event)
{
    console.log("init_user");
    add_user_profile(user_uid,                     user_info[__USER_INFO_NAME__], user_info[__USER_INFO_NICK__], 
                     user_info[__USER_INFO_PIC__], user_info[__USER_INFO_BIO__ ], user_info[__USER_INFO_HOME__]);
        
    // user_rooms
    init_user_rooms();
    fetch_user_contacts(user_uid);
    
    let ref = database.ref(`/users/${user_uid}/info`);
    ref.on("value", received_user_profile);
    register_firebase_listener(ref, "value", received_user_profile);

    $("#chat-input-row").show(400);
    $("#send-user-message").show(400);
    $("#user-message-text").show(400);
    $("#show-create-room-modal-button").show(400);

    navigation_setup(true);
}

function fetch_user_contacts(uid = user_uid)
{
    console.log(`fetch_user_contacts(${uid == user_uid, uid})`);

    //TODO privacy check
    let privacy = false;

    if (uid == user_uid)
    {
        //we already have a list to query the firebase data
        Object.keys(user_contacts).forEach( (key, index) => {
            console.log(key, index)
            //TODO error for when the profile is private, molto future feature
            
            //user_profiles will never remove a user once added
            attach_received_user_profile_listener( key, `/users/${key}/info`);
        } );
    }
    else
    {
        //we need to create a list to query the firebase data with
        let ref = database.ref("/users/" + uid + "/contacts");
        ref.once("value", received_user_contacts_list);
    }
}

function received_user_contacts_list(snapshot)
{
    console.log("received_user_contacts");
    let user_contacts = snapshot.val();
    Object.keys(user_contacts).forEach(key => {
        attach_received_user_profile_listener(key, `/users/${key}/info` );
    } );
}

function attach_received_user_profile_listener(key, ref)
{
    let reference = database.ref(ref);
    register_firebase_listener(ref, "value", received_user_profile);
    // (user_profiles.hasOwnProperty(key)) ? reference.once("value", received_user_profile)
    //                                     :
    reference.on("value", received_user_profile);
}

function received_user_profile(snapshot)
{
    console.log("received_user_profile");
    let user_info_root = snapshot.val();
    console.log(snapshot.ref.parent.key);
    add_user_profile(   snapshot.ref.parent.key,            user_info_root[__USER_INFO_NAME__], 
                        user_info_root[__USER_INFO_NICK__], user_info_root[__USER_INFO_PIC__ ], 
                        user_info_root[__USER_INFO_BIO__ ], user_info_root[__USER_INFO_HOME__]  );
}

function load_user_profile(event)
{
    console.log("load_user_profile", event.target.id, event.currentTarget.id);

    event.preventDefault();
    event.stopPropagation();

    queued_view_profile_user_id =
        (event.target.id != "nav-view-profile") ? event.currentTarget.getAttribute("data-user") 
                                                : user_uid;
    console.log(queued_view_profile_user_id);                                    
    show_modal_user_profile(event, view_user_profile_modal_prep);
}

function view_room_info_modal_prep()
{
    console.log("got here", "view_room_info_modal_prep");
    let ref=database.ref(`/rooms/chatrooms/${current_roomid}/info`);
    ref.once("value", populate_room_profile_modal).catch( function(event) {
        console.log("failed to retrieve room info");
    } );
}

function view_user_profile_modal_prep(event)
{
    //generate profile from data
    console.log("view_user_profile_modal_prep", queued_view_profile_user_id);
    if (queued_view_profile_user_id == user_uid)
    {
        populate_user_profile_modal();
    }
    else
    {
        let ref = database.ref("/users/" + queued_view_profile_user_id);
        ref.once("value", populate_user_profile_modal).catch( function(event) {
            console.log(event);
        });
        //update the modal to fix scrolling issue
    }
}


function change_contact(event)
{
    let change_contact_id = "#" + event.target.id;
    $(change_contact_id).off("click", change_contact);
    $(change_contact_id).parent().remove($(change_contact_id));
    // format of event.target.id = "change-contact-USERID"
}
// HELPER FUNCTIONS GO HERE


/**
 * Function sets up the "click" listeners for the page's nav links
 */
function setup_navigation_listeners()
{
    //chatroom nav buttons
    $(window).on("resize", resize_menu_button);
    resize_menu_button();
    $(".chat-show-users, .chat-show-chatrooms").on("click", toggle_chatrooms_users);

    $("#sign-in-method-button").addClass("noodlechat-alert").on("click", event => {$("#sign-in-method-button").removeClass("noodlechat-alert");});

    //  nav-logged-out
    $(".sign-in-methods > div").on("click", received_login_request);
    // #nav-logged-in
    $("#nav-view-profile").on("click", load_user_profile);
    $("#nav-signout").on("click", function(event) {
        firebase.auth().signOut();
    });
    $("#nav-find-contacts").on("click", show_modal_search_users);
    $("#nav-toggle-persistence").on("click", toggle_persistence);
}

// TODO JZM
async function add_contact(key, callback_fx = null)
{
    console.log(`add_contact(${key}, ${callback_fx})`);
    await firebase_add_contact(key);
    vars_add_contact(key, callback_fx);
}

async function remove_contact(key, callback_fx = null)
{
    console.log(`remove_contact(${key}, ${callback_fx})`);

    print_user_contacts();
    await firebase_remove_contact(key);
    print_user_contacts();
    vars_remove_contact(key, callback_fx);;
}

/**
 * Function removes children of the node identified by the identifier argument, 
 * and the node itself if it has the class .allow-empty. If children are matched
 * then nothing happens, as no nodes are allowed to be emptied.
 * 
 * When set to true, the indiscriminate variable means that when nodes or their 
 * children have the class .allow-empty, it will remove it's descendents. If the 
 * indiscriminate variable is false, then it will only remove descendents that
 * in turn do not have descendents with the .allow-empty class.
 * @param {*} identifier 
 * @param {*} indiscriminate 
 * @returns 
 */
function remove_allow_empty_children(identifier, indiscriminate = true)
{
    console.log(`remove_allow_empty_children(${identifier})`);
    let jq_elems = $(identifier);
    let selector = `allow-empty`;

    if (jq_elems.length == 0)
        return;
    
    if (indiscriminate)
    {
        jq_elems.each( function() {
            node = $(this);
            if (node.hasClass(selector))
                node.empty();
            else
                node.find(`.${selector}`).each( function() { $(this).empty(); });
        });
        return;
    }

    if (!has_allow_empty_descendents(node))
        return;

    jq_elems.each( function() {
        discerning_allow_empty(this);
    });
    return; 
}

function has_allow_empty_descendents(node)
{
    let selector = ".allow-empty";
    return ($(node).find(selector).length);
}

/**
 * Given a starting jQuery node with the allow-empty tag, traverse and remove
 * elements but keeping the tree structure so that no .allow-empty elements are
 * deleted
 * @param {*} node A jQuery node
 */
function discerning_allow_empty(node)
{
    let selector = `allow-empty`;
    //any guard clauses before performing should go here
    recurse(node);

    function recurse(node)
    {
        let has_class = $(node).hasClass(selector);
        let descendent_has_class = has_allow_empty_descendents(node);

        if (!has_class && !descendent_has_class)
            return $(node).remove();
        
        if (!descendent_has_class)
            return $(node).empty();

        node.children().each( function() {
            recurse(this);
        });
    }
}

function set_text_from_ref(firebase_ref_string, html_element_id)
{
    console.log("set_text_from_ref", firebase_ref_string, html_element_id);
    html_element_id = (html_element_id.indexOf("#") == 0) ? html_element_id : "#" + html_element_id;
    
    database.ref(firebase_ref_string).once("value").then(
        function (snapshot) {
            try {  
                console.log("A");
                console.log("B");
                console.log("C");
                console.log($(html_element_id));
                console.log(snapshot.val());
                console.log("D");
                let elems = $(html_element_id);
                elems.each( function(i) {  console.log(this); $(elems[i]).text( snapshot.val() ) } );    
            }    
            catch (error) {  console.log("set_text_from_ref", error);    }
        }
    );
}

function create_room(event)
{
    show_modal_room_create(event);
}

let prev_bp = "";
let BOOTSTRAP_BREAKPOINT_CHANGE_EVENT = "bootstrap_dbp_event";

function do_breakpoint_change_detection(event = null)
{
    let new_bp = get_new_breakpoint();
    if (prev_bp != new_bp)
    {
        let event = new CustomEvent(BOOTSTRAP_BREAKPOINT_CHANGE_EVENT, {
            bubbles : false,
            cancelable : false, 
            detail : { old_size : prev_bp, new_size : new_bp }
        });
        document.dispatchEvent(event);
        prev_bp = new_bp;
    }
}

function get_new_breakpoint(event = null)
{
    let id = $(`.bp-detector:visible`).attr("id");
    return $(`#${id}`).data("value");
}

$(document).ready(prep);