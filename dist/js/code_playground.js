console.log("loaded external code_playground.js");

//keys for firebase /user/info as well as keys for user_profiles
/** 
 * @description global variable to refer to the name attribute for use in firebase and local reference 
 * @type {string} */
let __USER_INFO_NAME__ = "name";
/** 
 * @type {string} 
 * @description global variable to refer to the nickname attribute for use in firebase and local reference */
let __USER_INFO_NICK__ = "nick";
/** 
 * @type {string} 
 * @description global variable to refer to the profile picture attribute for use in firebase and local reference */
let __USER_INFO_PIC__ = "pic";
/** 
 * @type {string} 
 * @description global variable to refer to the biographic info attribute for use in firebase and local reference */
let __USER_INFO_BIO__ = "bio";
/** 
 * @type {string} 
 * @description global variable to refer to the homepage attribute for use in firebase and local reference */
let __USER_INFO_HOME__ = "homepage";
//keys for users in user_profiles object  user_profiles.user_id.key
/** 
 * @type {string} 
 * @description global variable to refer to the CSS class name attribute for use in local reference */
let __USER_PROFILE_CSS__ = "css_class_name";
/** 
 * @type {string} 
 * @description global variable to refer to the color attribute for use in local reference */
let __USER_PROFILE_COLOR__ = "color";

 /**
  * @type {string}
  * @description global string variable of the URI to find the default profile image
  */
let __DEFAULT_PROFILE_IMAGE_LINK__ = "./images/unknown_profile.jpg";

/**
 * @type {string}
 * @description global string variable of the URI to find the default room image
 */
let __DEFAULT_ROOM_IMAGE_LINK__ = "./images/empty-round-room.jpg";

/**
 * @type {string}
 * @description global boolean variable on whether to use the 24 hour clock or not
 */
let __USE_24_HOUR_CLOCK__ = false;

/**
 * @type {string}
 * @description global storage variable for a user id
 */
let queued_view_profile_user_id = "";

/**
 * @type {string}
 * @description global string variable for the user id of the currently signed in user
 */
let user_uid;

/**
 * @type {object}
 * @description global object containing the currently logged in user's personal info from firebase
 */
let user_info;
/**
 * @type {string}
 * @description global object containing the currently logged in user's personal contacts from firebase
 */
let user_contacts;
/**
 * @type {object}
 * @description global variable containing tokens that the user has been given in order to confirm relationships or memberships
 */
let user_tokens;
/**
 * @type {object}
 * @description global object showing the currently logged in user's membership of chatrooms
 */
let user_rooms;

/**
 * @type {object}
 * @description global object representing all user's the current user has been in contact with
 */
let user_profiles = {};

/**
 * @type {Database}
 * @description global object storing the service for the firebase Database this app is based on
 */
var database;

/**
 * @type {Auth}
 * @description global object storing the service for the firebase auth system
 */
var auth;

/**
 * @type {Function}
 * @param {Event} event The triggering event, can be left null or empty as it's not referenced in the function
 * @description Function does any setup that needs to be performed on first load
 */
async function initialize_app(event)
{
    setup_navigation_listeners();
    init_modal_button_functions();
    init_chat_section();
    
    //dummy_data();
    user_info = {};
    connect_to_firebase();
    await auth_init();
    $(`#welcomeModal`).modal(`show`);
}

/**
 * @type {Function}
 * @description Function adds the user and the data associated with the user_id to the system with all associated styling.
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
        user_profiles[user_id] = populate_profile_parameters(user_profiles[user_id], user_name, nickname, profile_pic_link, bio_info, homepage_link, null, null);
    else
    {
        user_profiles[user_id] = populate_profile_parameters({}, user_name, nickname, profile_pic_link, bio_info, homepage_link, 
                                                             create_next_user_color(), "user_" + user_id.toString());
        create_user_style(user_id);
    }

    update_user_data_in_gui(user_id);
}

/**
 * @description Function calls {@link change_user_data_in_gui} with the same argument
 * @type {Function}
 * @see {@link change_user_data_in_gui} function
 * @param {*} user_id For info see {@link change_user_data_in_gui} argument
 */
function update_user_data_in_gui(user_id) { change_user_data_in_gui(user_id); }

/**
 * @description Wherever data-user-[bio|name|nick|home|logo] is used in an object (or in the case of images, in an img|Object)
 * the visual data is updated to reflect what is stored in user_profiles.
 * @param {*} user_id The id of the user
 * @type {Function}
 */
function change_user_data_in_gui(user_id)
{
    $(`*[data-user-bio="${user_id}"]`).html(user_profiles[user_id][__USER_INFO_BIO__]);
    $(`*[data-user-name="${user_id}"]`).html(user_profiles[user_id][__USER_INFO_NAME__]);
    $(`*[data-user-nick="${user_id}"]`).html(user_profiles[user_id][__USER_INFO_NICK__]);
    $(`*[data-user-home="${user_id}"]`).html(user_profiles[user_id][__USER_INFO_HOME__]);
    $(`img[data-user-logo="${user_id}"]`).attr("src", user_profiles[user_id][__USER_INFO_PIC__]);
    $(`Object[data-user-logo="${user_id}"]`).attr("data", user_profiles[user_id][__USER_INFO_PIC__]);
}

/**
 * @type {Function}
 * @description This function takes care of creating or amending a profile, taking into account default values for the objects
 * in the user_profile variable.
 * @param {object} obj The object that will have all the key value pairs added to
 * @param {string} user_name The user_name that is passed
 * @param {string} nickname The user nickname that is passed
 * @param {string} profile_pic_link The url to the profile picture
 * @param {string} bio_info The submitted profile bio
 * @param {string} homepage_link The link to the user's homepage
 * @param {string} profile_color The color assigned to the user for this session
 * @param {string} profile_css_name The CSS classname for this user in this session
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
 * @description A helper function that populates an object's key making sure not to fill it with null or "" values unless it's
 * defined as a default value
 * @type {Function}
 * @param {object} obj The object the key belongs or will belong to
 * @param {string} key The key of the object to be filled
 * @param {string} value The value passed for the key
 * @param {string} default_value The fallback value if value is null or ""
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

/**
 * @description Function sets up the global variables for the currently logged in user and sets up the chat app
 * ready for the user to use
 * @type {Function}
 * @param {event} event The event that has triggered this function
 */
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

/**
 * @type {Function}
 * @description Function attempts to retrieve a user's contacts and performs required functions to make them usable for the chat
 * application
 * @param {string} uid The id of the user to fetch the contacts list of
 * @todo privacy check
 * @todo error for when the profile is private, molto future feature
 */
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

/**
 * @type {Function}
 * @description Function receives a snapshot of a user's contact list and then calls a function that makes a request for 
 * information on each of those contacts
 * @param {snapshot} snapshot 
 */
function received_user_contacts_list(snapshot)
{
    console.log("received_user_contacts");
    let user_contacts = snapshot.val();
    Object.keys(user_contacts).forEach(key => {
        attach_received_user_profile_listener(key);
    } );
}

/**
 * @type {Function}
 * @description Function makes a request for user information from the firebase database using the user's id
 * @param {string} id The user's id to retrieve the profile of
 */
async function attach_received_user_profile_listener(id)
{
    let reference = database.ref(`/users/${id}/info`);
    register_firebase_listener(reference, "value", received_user_profile);
    reference.on("value", received_user_profile);
}

/**
 * @type {Function}
 * @description Function receives a snapshot containing a user's info from firebase, and stores it locally for use.
 * @param {snapshot} snapshot A snapshot of the user's firebase info object
 */
async function received_user_profile(snapshot)
{
    console.log("received_user_profile");
    console.log(snapshot);
    let user_info_root = snapshot.val();
    console.log(snapshot.ref.parent.key);
    add_user_profile(   snapshot.ref.parent.key,            user_info_root[__USER_INFO_NAME__], 
                        user_info_root[__USER_INFO_NICK__], user_info_root[__USER_INFO_PIC__ ], 
                        user_info_root[__USER_INFO_BIO__ ], user_info_root[__USER_INFO_HOME__]  );
}

/**
 * @type {Function}
 * @description Function initiates the loading of a user's profile and stores the id in {@link queued_view_profile_user_id}
 * to be used by a modal later. If the {@link event} argument has the property 
 * @param {event} event The user-driven event that has initiated this request for user information
 * @param {string} event.currentTarget[data-user] is a property of an element that has triggered this event that if it exists,
 * contains the id of the user to display the profile of
 */
function load_user_profile(event)
{
    console.log("load_user_profile", event.target.id, event.currentTarget.id);

    event.preventDefault();
    event.stopPropagation();

    queued_view_profile_user_id =
        (event.target.id != "nav-view-profile") ? event.currentTarget.getAttribute("data-user") 
                                                : user_uid;
    console.log(queued_view_profile_user_id);                                    
    show_modal_user_profile(event);
}

/**
 * @type {Function}
 * @description Function initiates a call to retrieve the current chatrooms information for display in the room info modal
 */
function view_room_info_modal_prep()
{
    console.log("got here", "view_room_info_modal_prep");
    let ref=database.ref(`/rooms/chatrooms/${current_roomid}/info`);
    ref.once("value", populate_room_profile_modal).catch( function(event) {
        console.log("failed to retrieve room info");
    } );
}

/**
 * @type {Function}
 * @description Function prepares the modal for 
 * @param {*} event 
 */
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
    $("#sign-in-method-button").on("click", () => { _auto_login = false; });
    // #nav-logged-in
    $("#nav-view-profile").on("click", load_user_profile);
    $("#nav-signout").on("click", function(event) {
        firebase.auth().signOut();
    });
    $("#nav-find-contacts").on("click", show_modal_search_users);
    $("#nav-toggle-persistence").on("click", toggle_persistence);

    $(`.navbar-brand`).on("click", event => { $(`#welcomeModal`).modal(`show`) });
}

/**
 * @type {Function}
 * @description Initializes initial listeners for the chat application section on the webpage
 */
function init_chat_section()
{
    //message sending functionality and visibility
    $("#chat-input-row").hide();
    $("#send-user-message").on("click", send_message_event).hide();
    $("#user-message-text").on("keypress", event => {
        if (event.key === 'Enter') { send_message_event(event); }
    });
    $("#user-message-text").on("click", clear_message_text).hide();
    //chatroom creation button listener
    $("#show-create-room-modal-button").on("click", event => show_modal_room_create(event)).hide();
    //detect bootstrap breakpoints and scroll the chat messages (if any) to the most recent one
    window.onresize = do_breakpoint_change_detection;
    document.addEventListener(BOOTSTRAP_BREAKPOINT_CHANGE_EVENT, scroll_to_last_row);
}

/**
 * This function adds the user defined in the key parameter from the current user's contact list
 * @param {String} key This is the unique identifier for the user that you wish to add
 */
async function add_contact(key)
{
    console.log(`add_contact(${key})`);
    await firebase_add_contact(key);
    retrieve_user_info(key);
}

/**
 * This function removes the suer defined in the key parameter from the current user's contact list
 * @param {String} key 
 */
async function remove_contact(key)
{
    console.log(`remove_contact(${key}, ${callback_fx})`);

    print_user_contacts();
    await firebase_remove_contact(key);
    print_user_contacts();
    vars_remove_contact(key);;
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

/**
 * Helper function to search for any child descendent of this DOM element with the class allow-empty
 * @param {DOM Element} node 
 * @returns Integer value of the number of descendents from 0 upwards.
 */
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

/**
 * Function sets a DOM element identified by it's id property with a retrieved value from the firebase
 * realtime database defined by the string reprentation of the path the data is stored.
 * @param {String} firebase_ref_string String value of the path in the database to retrieve data from
 * @param {String} html_element_id String value of the DOM element(s) ID to replace it's text node value
 */
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

$(document).ready(initialize_app);