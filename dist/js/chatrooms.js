let CHATROOM_VERBOSE_DEBUG = false;

//holds room data
let room_info = {};
let current_roomid;

//keys for local room_info, keys share firebase keys, although not exclusively in firebase's room info object
let __ROOMINFO_MSGS_KEY__ = "messages";
let __ROOMINFO_USRS_KEY__ = "users";
let __ROOMINFO_NAME_KEY__ = "name";
let __ROOMINFO_CRTR_KEY__ = "creator";
let __ROOMINFO_LOGO_KEY__ = "logo";

//JSON keys for message
let __MSG_TEXT_KEY__ = "media_msg";
let __MSG_TYPE_KEY__ = "media_typ";
let __MSG_TIME_KEY__ = "timestamp";
let __MSG_USER_KEY__ = "user";

//when fetching messages from firebase, limit initial fetch to the last X values
let __INITIAL_MESSAGES_FETCH_LIMIT__ = 30; 
//when fetching older messages from firebase, request the previous X values
let __MESSAGE_GROUPINGS__ = 10; //todo allow to view older messages by some action

async function init_user_rooms()
{
    console.log("init_user_rooms");
    if (user_rooms != null)//if user_rooms exists
    {
        //if not set, user_rooms will have { room_key: true } objects, true needs to be replaced with the room_name
        let room_keys = Object.keys(user_rooms);
        for (let i=0; i < room_keys.length; i++)
        {
            await init_room(room_keys[i]);
        }
    }
    database.ref(`/users/${user_uid}/rooms`).on("child_added", user_was_added_to_chatroom)
}

let temporary_room_snapshot = null;

async function user_was_added_to_chatroom(snapshot)
{
    temporary_room_snapshot = snapshot;
    let room_key = snapshot.key;
    if (!(room_key in user_rooms))
        user_rooms[room_key] = true;
    await init_room(room_key);
}

async function init_room(room_id)
{
    let is_new_room = await add_room(room_id); //this populates room_info[room_id]
    add_room_to_menu(room_id); //this uses room_info[room_id] data
    if (is_new_room)
    {
        let ref = database.ref(`/rooms/chatrooms/${room_id}/messages`);
        ref.orderByChild(__MSG_TIME_KEY__).limitToLast(__INITIAL_MESSAGES_FETCH_LIMIT__).on("child_added", message_received);
        register_firebase_listener(`/rooms/chatrooms/${room_id}/messages`, "child_added", message_received);
    }
}

function toggle_chatrooms_users(event)
{
    let show_users = $(event.currentTarget).hasClass("chat-show-users");
    console.log(show_users);
    $("#chatroom-nav").css("overflow", "hidden hidden");     //hide overflow from parent div
    $("#chatrooms-div, #chatroom-users-div").removeClass("d-none").addClass("d-block");    //add display-block to children
    //style buttons     //animate children    //add display-none to hidden child    //add overflow to parent div
    (show_users) ? side_nav_show_users() : side_nav_show_chatrooms();
}

function side_nav_show_users()
{
    $(".chat-show-users").removeClass("text-secondary").addClass("text-light");
    $(".chat-show-chatrooms").addClass("text-secondary").removeClass("text-light");

    $("#chatroom-users-div").animate( { left : 0 }, { duration : ".6s"});
    $("#chatrooms-div").animate( { left : "-100%" }, { duration : ".6s", complete : function() 
                                                                                    {   $("#chatrooms-div").addClass("d-none").removeClass("d-block");
                                                                                        $("#chatroom-nav").css( "overflow", "hidden overlay");   } });
}

function side_nav_show_chatrooms()
{
    $(".chat-show-users").addClass("text-secondary").removeClass("text-light");
    $(".chat-show-chatrooms").removeClass("text-secondary").addClass("text-light");

    $("#chatroom-users-div").animate( { left : "100%" }, { duration : ".6s"});
    $("#chatrooms-div").animate( { left : 0 }, { duration : ".6s", complete : function() 
                                                                              {   $("#chatroom-users-div").addClass("d-none").removeClass("d-block");
                                                                                  $("#chatroom-nav").css( "overflow", "hidden overlay");}   });
}


/**
 * Function takes a room_id and checks if that there's not a room already internally stored with that
 * unique room_id. If so, then it sends a request to the firebase database for information to be stored
 * locally. If not, no information request is performed and a return of false is given, signifying that 
 * this room is already being tracked internally
 * @param {*} room_id 
 * @returns Boolean Whether the room was added 
 */
async function add_room(room_id)
{
    console.log(`add_room(${room_id}) : ${room_info.hasOwnProperty(room_id)}`);
    if (room_info.hasOwnProperty(room_id))
        return false;
    
    room_info[room_id] = await firebase_get_room_info(room_id);
    firebase_add_room_listener(room_id);
    return true;
}

/**
 * 
 * @param {*} room_id 
 * @param {*} room_name Human readable name
 * @param {*} room_creator uid of the room's creator
 * @param {*} room_logo Link to the room's logo, if any
 * @param {*} users Array of users of this room, identified by their uid
 * @returns An object with the rooms properties
 */
function add_non_firebase_room(room_id, room_name, room_creator, room_logo, users)
{

    if (room_info.hasOwnProperty(room_id))
    {
        throw new Error(`"add_non_firebase_room(${room_id}, ...args)Room already exists"`)
    }

    let obj = {};
    obj[__ROOMINFO_NAME_KEY__]  = room_name;
    obj[__ROOMINFO_CRTR_KEY__]  = room_creator;
    obj[__ROOMINFO_LOGO_KEY__]  = room_logo;
    obj[__ROOMINFO_USRS_KEY__]  = users;

    room_info[room_id] = obj;

    return obj
}

/**
 * 
 * Function adds the room to the side menu bar
 * @param {*} room_name String with a hopefully user readable roomname
 * @param {*} room_id roomid from firebase server
 * @param {*} image_url 
 * @returns The button-shaped element that was added or Null if no element was added.
 */
async function add_room_to_menu(room_id)
{
    let room_name = room_info[room_id][__ROOMINFO_NAME_KEY__];
    let room_logo_url = room_info[room_id][__ROOMINFO_LOGO_KEY__];
    console.log(`add_room_to_menu(${room_id}) => room_name: ${room_name}, room_icon: ${room_logo_url}`);

    if ($(`#${room_id}`).length > 0) return null; //already exists
    
    let initials_arr = room_name.split(` `);
    let room_div = $(`<div id="${room_id}" class="room-button" data-toggle="collapse" data-target="#sidemenu-room-summary-${room_id}" data-roomid="${room_id}" >`);
    let full_room_name = $(`<div class="full-chatroom-name" data-room-name="${room_id}">`).append(room_name);
    
    if (room_name.length > 12)
        room_div.addClass(`full-room-minim`);
    
    room_div.append( full_room_name );
        
    (room_logo_url != null && room_logo_url != "") ? attempt_room_logo(room_div, room_logo_url, initials_arr, room_id)
                                                   : add_room_initials(room_div, initials_arr);

    room_div.on("click", room_selected);
    $("#chatrooms-div").append(room_div)
    .append( create_description_div(room_id, room_name, room_info[room_id][__ROOMINFO_CRTR_KEY__]) );

    return room_div;
}

function attempt_room_logo(div, img_src, initials_arr, room_id)
{
    let image = $(`<img class="room-icon" data-room-logo="${room_id}">`);
    image.on(`load`, function() { 
            console.log("image loaded");
            div.append(image); }
    ).on(`error`, function() { 
            console.log("image load failed");
            add_room_initials(div, initials_arr); }
    ).attr("src", img_src);
}

function add_room_initials(div, initials_arr)
{
    console.log(`add_room_initials`, div, initials_arr)
    let first_initial = $(`<div class="room-initial">${initials_arr[0].substr(0, 1)}</div>`);
    div.append(first_initial);
    
    if (initials_arr.length == 1)
        first_initial.addClass(`only-letter`);

    console.log($(first_initial).attr("class"));
    if (initials_arr.length > 1)
        div.append( $(`<div class="room-initial second-letter">${initials_arr[1].substr(0, 1)}</div>`) );
}

function create_description_div(room_id, room_name, room_creator_id)
{
    let room_creator_name = (room_creator_id in user_profiles) ? user_profiles[room_creator_id][__USER_INFO_NICK__] : "Not in friends list";
    let desc_div = $(
        `<div id="sidemenu-room-summary-${room_id}" class="border-top border-bottom border-primary collapse my-2">\n` +
        `    <label for="${room_id}-sidemenu-summary-name" class="small sidemenu-room-summary-label">Roomname:</label>\n` +
        `    <div id="${room_id}-sidemenu-summary-name" data-room-name="${room_id}" class="sidemenu-room-summary-text text-center">${room_name}</div>\n` +
        `    <label for="${room_id}-sidemenu-summary-creator" class="small sidemenu-room-summary-label">Creator:</label>\n` +
        `    <div id="${room_id}-sidemenu-summary-creator" data-user-nick="${room_creator_id}" class="sidemenu-room-summary-text text-center">${room_creator_name}</div>\n` +
        `</div>\n`);
    let room_info_btn_div = $(`<div class="text-center">`);
    let room_info_btn = $(`<a class="btn py-0 my-2 btn-outline-primary" data-roomid="${room_id}">`).append("Info").on("click", show_room_info);
    desc_div.append( room_info_btn_div.append(room_info_btn) );
    desc_div.on("shown.bs.collapse", event => {
        event.currentTarget.scrollIntoView(false, { behavior: "smooth", block: "end" } );
    });
    set_text_from_ref(`/users/nicks/${room_creator_id}`, `#${room_id}-sidemenu-summary-creator`);
    return desc_div;
}

function show_room_info(event)
{
    room_selected(event);
    show_modal_room_info(event, view_room_info_modal_prep);
}

/**
 * A visual alert to the user that the chatroom has been updated in some way that needs
 * attention 
 * @param {*} room_key 
 */
function flash_room_on_menu(room_key)
{
    // console.log("flash_room_on_menu:", room_key);
    if ( room_key != current_roomid && ! $("#" + room_key).hasClass("has-unread-messages") )
    {
        $("#" + room_key).addClass("has-unread-messages");
    }
}

/**
 * Triggered as of writing by an li element whose id is the room's id
 * @param {*} event 
 */
function room_selected(event)
{
    console.log("room_selected() event triggered");
    $(".current-room").removeClass("current-room");
    // console.log(event);
    // console.log(event.currentTarget);
    // console.log(event.currentTarget.id);
    current_roomid = event.currentTarget.getAttribute("data-roomid");
    $(`#${current_roomid}`).removeClass(`has-unread-messages`).addClass(`current-room`);
    // console.log(current_roomid, $(event.currentTarget).data("roomid"));
    let data_target = $(`#${current_roomid}`).data("target");
    $(".room-button").not(`#${current_roomid}`).not('.collapsed').addClass("collapsed").attr("aria-expanded", "false");
    $("#chatrooms-div .collapse.show").not(data_target).removeClass("show");
    load_room_chat(current_roomid);
    load_room_users(current_roomid);
}

function load_room_chat(room_id)
{
    console.log("load_room_chat(" + room_id + ")");
    console.log("room_info:");
    console.log(room_info);

    //if (room_id in room_info)
    if (room_info.hasOwnProperty(room_id))
    {
        // console.log("removing chats-alert CSS");
        $(`#${room_id}`).removeClass("has-unread-messages");
        $("#chatlog").empty();

        let msgs = room_info[room_id][__ROOMINFO_MSGS_KEY__];
        if (!msgs)
            msgs = {};
        Object.keys(msgs).forEach(key => {
            //console.log(key, user_rooms[key]);
            let msg = msgs[key];
            add_chatroom_message(msg[__MSG_USER_KEY__], msg[__MSG_TIME_KEY__], msg[__MSG_TEXT_KEY__]);
        });
    }
}

function load_room_users(room_id)
{
    console.log(`load_room_users(${room_id})`);
    if (room_id in room_info)
    {
        remove_allow_empty_children(`#chatroom-users-div`);

        let usrs = room_info[room_id][__ROOMINFO_USRS_KEY__];
        console.log(usrs);
        if (!usrs)
            usrs = {};
        Object.keys(usrs).forEach(key => {
            add_to_chatroom_users_list(usrs[key]);
        });
    }
}

async function add_to_chatroom_users_list(chatroom_usr_id)
{
    console.log(chatroom_usr_id);
    console.log(user_profiles);

    if (!(chatroom_usr_id in user_profiles))
        await retrieve_user_info(chatroom_usr_id);

    let chatroom_usr_nick = user_profiles[chatroom_usr_id][__USER_INFO_NICK__];

    //create a link
    let usr_div=$(`<div id="chatroom-member-${chatroom_usr_id}" class="chatroom-member">`)
                .css("background-color", `#${user_profiles[chatroom_usr_id][__USER_PROFILE_COLOR__]}`)
                .append(`<img src="${user_profiles[chatroom_usr_id][__USER_INFO_PIC__]}">`)
                .append(`<div data-user-nick="${chatroom_usr_id}">${chatroom_usr_nick}</div>`)
                .on("click", event => {
                        queued_view_profile_user_id = chatroom_usr_id;
                        show_modal_user_profile(event, view_user_profile_modal_prep);
                    });
    $("#chatroom-users-div").append(usr_div);
}

function modify_chatroom_values(snapshot, event_string)
{
    let room_key;
    switch (event_string)
    {
        case "child_changed" :
            room_key = snapshot.ref.parent.parent.key;
            console.log("detected change of room_id:", room_key);
            console.log(room_key, snapshot.key, snapshot.val());
            room_info[room_key][snapshot.key] = snapshot.val(); //Change locally internally stored information
            if (snapshot.key == __ROOMINFO_NAME_KEY__)
                $(`[data-room-name="${room_key}"]`).html(snapshot.val());
            if (snapshot.key == __ROOMINFO_LOGO_KEY__)
            {
                let str1 = `img[data-room-logo="${room_key}"]`;
                let str2 = `Object[data-room-logo="${room_key}"]`;
                console.log(str1, str2, snapshot.val());
                $(str1).attr("src", snapshot.val());
                $(str2).attr("data", snapshot.val());
                console.log("you need to change the url buddy TODO");
            }
            break;
        default :
            break;
    }
}

function modify_chatroom_user_list(event)
{

}

/**
 * Function is only concerned with adding the message to the display
 * @param {*} user_id 
 * @param {*} time_stamp 
 * @param {*} message_string 
 * @returns The div object containing the message
 */
async function add_chatroom_message(user_id, time_stamp, message_string)
{
    console.log("add_chatroom_message :- ", user_id, time_stamp, message_string);
    if (!(user_id in user_profiles))
    {
        let user_ref = database.ref("/users/nicks/" + user_id);
        user_ref.once("value").then(
            function(snapshot) {
                //console.log(snapshot.ref.toString(), snapshot.key, snapshot.val());
                let user_root = snapshot.val();
                add_user_profile(user_id, user_root[__USER_INFO_NAME__], 
                    user_root[__USER_INFO_NICK__], user_root[__USER_INFO_PIC__], 
                    user_root[__USER_INFO_BIO__], user_root[__USER_INFO_HOME__]);
                return continue_to_add_chatroom_message(user_id, time_stamp, message_string);
            }
        );
    }
    else
        return continue_to_add_chatroom_message(user_id, time_stamp, message_string);
}
 
 /**
  * DO NOT CALL, HELPER FUNCTION FOR ANOTHER FUNCTION
  * @param {*} user_id 
  * @param {*} time_stamp 
  * @param {*} message_string 
  * @returns The div object containing the message
  */
function continue_to_add_chatroom_message(user_id, time_stamp, message_string)
{
    //console.log("continue_to_add_chatroom_message()", user_id, time_stamp, message_string); 
    let user_css_name = user_profiles[user_id][__USER_PROFILE_CSS__];
    let new_message_id = time_stamp.toString() + "-" + user_id.toString();

    let message_row = $(document.createElement("div")).addClass("row message-content-row");

    let insert_before_message_row = find_insert_before_point(time_stamp);

    (insert_before_message_row == null) ? $("#chatlog").append(message_row)
                                        : $(message_row).insertBefore( insert_before_message_row );
    
    (user_id == user_uid) ? create_user_message_div(message_row, new_message_id, message_string, user_css_name, time_stamp)
                          : create_other_user_message_div(message_row, user_id, new_message_id, message_string, time_stamp);
    
    scroll_to_last_row();
    return message_row;
}

function debug_print_timestamps(message_doms = null)
{
    console.log(`debug_print_timestamps()`);
    if (message_doms == null)
        message_doms = $("#chatlog > div > div.all-messages");
    let parsed_string = "";
    console.log("length:" + message_doms.length + "\n");
    if (message_doms.length != 0)
    {
        for (let j=0; j < message_doms.length; j++)
        {
            let parse_id = /**(parse_messages.length == 1) ? parse_messages.id :*/ message_doms[j].id;
            let parse_ts = parse_id.substring(0, parse_id.indexOf("-"));
            parsed_string += parse_ts + "\n";
        }
    }
    console.log(parsed_string);
}

function find_insert_before_point(time_stamp)
{
    if (CHATROOM_VERBOSE_DEBUG)
        console.log(`find_insert_before_point`);
    let all_messages = $("#chatlog > div > div.all-messages");
    let insert_before_message_row = null;
    let found = false;
    if (all_messages.length > 0)
    {
        if (CHATROOM_VERBOSE_DEBUG)
            console.log("----");
        //debug_print_timestamps(all_messages);

        for (let i=all_messages.length -1; i >=0 && !found; i--)
        {
            let msg_id = all_messages[i].id;
            //prev_msg_id is semantically correct BUT not time correct
            let prev_msg_id = (i == all_messages.length -1) ? "" 
                                                            : all_messages[i+1].id;
            let i_timestamp = parseInt(msg_id.substring(0, msg_id.indexOf("-")));
            if (CHATROOM_VERBOSE_DEBUG)
                console.log(`   timestamp: ${time_stamp}, i_timestamp: ${i_timestamp}`);
            found = (parseInt(time_stamp) > parseInt(i_timestamp));
            if (found)
            {
                if (CHATROOM_VERBOSE_DEBUG)
                    console.log("   parseInt(time_stamp) > parseInt(i_timestamp)");
                if (prev_msg_id != "") //no previous id means it needs to be added to the bottom of the chatlog as this is only the case for i=length-1
                    insert_before_message_row = $("#" + prev_msg_id).parent();
                if (CHATROOM_VERBOSE_DEBUG)
                    console.log("   prev_msg_id:", prev_msg_id, insert_before_message_row);
            }
        }

        if (!found)
            insert_before_message_row = $(`#${all_messages[0].id}`).parent(); //add to the top as it's the lowest value
    }

    return insert_before_message_row
}

//TODO #10 Insert comment time

function create_user_message_div(dom_elem, msg_id, msg_string, usr_css_name, time_stamp) //JZMTODO time_stamp
{
    console.log(`create_user_message_div(${dom_elem}, ${msg_id}, ${msg_string}, ${usr_css_name})`);
    let div = $(`<div id=${msg_id} class="all-messages this-user-message col-9 ${usr_css_name}">`);
    div.append(msg_string);
    $(dom_elem).append(div);

    let time_row = $(`<div class="row"><div class="col-9 px-0 text-right message-meta-info message-meta-content">by You, <br class="d-sm-none">${human_readable_timestamp(time_stamp)}</div></div>`);
    time_row.insertAfter(dom_elem);
    return dom_elem;
}

function create_other_user_message_div(dom_elem, other_user_id, msg_id, msg_string, time_stamp) //JZMTODO time_stamp
{
    console.log(`create_other_user_message_div()`);
    let user_css_name = user_profiles[other_user_id][__USER_PROFILE_CSS__];
    let user_nickname = user_profiles[other_user_id][__USER_INFO_NICK__]; 

    let msg_div = $(`<div id="${msg_id}" class="all-messages other-user-msg col-9 offset-2 ${user_css_name}">`).append(msg_string);

    let bbl = $(`<div class="col-1 speech-bg ${user_css_name}">`);
    let spk = $(`<div class="other-user-speech h-100 w-100">`);
    bbl.append(spk);

    dom_elem.append(msg_div);//.append(bbl);

    let username_row = $(`<div class="row">`);
    let username_row_nick_span = $(`<span data-user-nick="${other_user_id}">${user_nickname}</span>`);
    username_row_nick_span.on("click", function() {
        queued_view_profile_user_id = other_user_id;
        show_modal_user_profile(null, view_user_profile_modal_prep);
    })
    let msg_uid = $(`<div class="message-meta-info px-0 col-10 offset-2">`)
                .append(`by `)
                .append(username_row_nick_span)
                .append(`, <br class="d-sm-none">${human_readable_timestamp(time_stamp)}`);

    username_row.append(msg_uid);
    //dom_elem.append(username_row);
    username_row.insertAfter(dom_elem);
    return dom_elem;
}

/**
 * Function takes a date and returns a String object that is an intuitive and non-confusing
 * representation of that date.
 * @param {*} time_stamp time in milliseconds or date object
 * @returns A string displaying the time in a non-confusing human readable format
 */
function human_readable_timestamp(time_stamp)
{
    time_stamp += _time_offset;
    if (!(time_stamp instanceof Date || Number.isInteger(time_stamp) || Number.isInteger(Number.parseInt(time_stamp))))
        return `Not a date:${time_stamp}`;

    let time_stamp_date = (time_stamp instanceof Date) ? new Date(time_stamp.getTime() + _time_offset) : new Date(Number.parseInt(time_stamp));
    let diff = (new Date()).getTime() - time_stamp;
    let one_day = 1000 * 60 * 60 * 24;
    let str = "";

    let local_time,
        ts_hours = time_stamp_date.getHours();

    if (__USE_24_HOUR_CLOCK__)
        local_time = time_stamp_date.toLocaleTimeString().substr(0, 5);
    else
        local_time = (ts_hours > 12)  ? `${ts_hours-12}${time_stamp_date.toLocaleTimeString().substr(2, 3)}pm`
                                      : `${ts_hours-00}${time_stamp_date.toLocaleTimeString().substr(2, 3)}am`;

    if (diff < one_day)
        str = `Today @ ${local_time}`;
    else if (diff < one_day * 7)
        str = `${new Intl.DateTimeFormat('en-UK', { weekday : 'short'}).format(time_stamp_date)} @ ${local_time}`;
    else
        str = `${Math.floor(diff/one_day)} days ago @ ${local_time}`;
    
    return `<span class="meta-timestamp">${str}</span>`;
}


/**
 * When fired, removes the text/value associated with the object that fired the event
 * @param {*} event 
 */
function clear_message_text(event = null)
{
    $("#" + event.target.id).val("");
}

/**
 * Function will add message to the server
 * @param {*} event 
 */
function send_message_event(event)
{
    console.log("send_message_event() take 2", event);
    let chat_message_type = "TEXT";
    let chat_message_content = $("#user-message-text").val().trim();
    
    if (current_roomid == "robot_help" || current_roomid == "") //as it currently stands, when current_roomid == "", the help room is the currently displayed room
    {
        $("#user-message-text").val("Click on an option to engage with this chatroom");
        return;
    }

    if (chat_message_content != "")
    {
        add_message_to_firebase(current_roomid, chat_message_type, chat_message_content);
        clear_message_text({ target : { id : "user-message-text"}});
    }
    else
        $("#user-message-text").val("");
}

async function create_room_event(event)
{
    let room_name_submitted = $(`#room-create-name`).val().trim();
    let room_logo_submitted = $(`#room-create-logo`).val().trim();
    console.log(`create_room_event`, room_name_submitted, room_logo_submitted);
    let room_key = await firebase_create_chatroom(room_name_submitted, room_logo_submitted);
    user_rooms[room_key] = true;
    await init_user_rooms();
    let div = $(`<div data-roomid="${room_key}">`);
    div.on("click", room_selected).trigger("click");
    hide_visible_modal();
}

async function update_room_from_modal(event)
{
    let room_id = current_roomid;
    let room_name_submitted = $(`#room-profile-set-name-tf`).val().trim();
    let room_logo_submitted = $(`#room-profile-set-logo-tf`).val().trim();
    await firebase_edit_chatroom(room_id, room_name_submitted, room_logo_submitted).then(
        function() {
            show_modal_room_info(null, view_room_info_modal_prep);
        }
    );
}

function reset_chatroom()
{
    remove_allow_empty_children(`#chat-app`, false);
}

/**
 * Function when it receives an event will scroll the chatlog screen so the user
 * can see the most recent message
 * @param {*} event 
 */
function scroll_to_last_row(event)
{
    let last_row_index = $(`#chatlog .row`).length - 1;
    if (last_row_index > 0)
        $(`#chatlog .row`)[last_row_index].scrollIntoView({behavior: "smooth", block: "end"});
}