console.log("loaded here 1");

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
    // user_rooms
    if (user_rooms != null)//if it exists
    {
        //if not set, user_rooms will have { room_key: true } objects, true needs to be replaced with the room_name
        let room_keys = Object.keys(user_rooms);
        for (let i=0; i < room_keys.length; i++)
        {
            let i_roomid = room_keys[i];
            let is_new_room = await add_room(i_roomid);
            add_room_to_menu(i_roomid);
            if (is_new_room)
            {
                let ref = database.ref(`/rooms/chatrooms/${i_roomid}/messages`);
                ref.orderByChild(__MSG_TIME_KEY__).limitToLast(__INITIAL_MESSAGES_FETCH_LIMIT__).on("child_added", message_received);
                register_firebase_listener(`/rooms/chatrooms/${i_roomid}/messages`, "child_added", message_received);
            }
        }
    }
}

/**
 * 
 * Function handles adding a room along with internal logic
 * @param {*} room_name 
 * @param {*} room_id 
 * @returns Boolean whether the room was added
 */
async function add_room(room_id)
{
    console.log(`add_room(${room_id}) : ${room_info.hasOwnProperty(room_id)}`);
    if (room_info.hasOwnProperty(room_id))
        return false;
    
    room_info[room_id] = await firebase_get_room_info(room_id);
    return true;
    // TODO add_room_to_menu(room_name, room_id, image_url);
}

/**
 * 
 * Function adds the room to the side menu bar
 * @param {*} room_name String with a hopefully user readable roomname
 * @param {*} room_id roomid from firebase server
 * @param {*} image_url 
 * @returns Whether the room was added to the menu
 */
async function add_room_to_menu(room_id)
{
    let room_name = room_info[room_id][__ROOMINFO_NAME_KEY__];
    let room_icon_url = room_info[room_id][__ROOMINFO_LOGO_KEY__];
    console.log(`add_room_to_menu(${room_id}) => room_name: ${room_name}, room_icon: ${room_icon_url}`);
    if ($(`#${room_id}`).length > 0)
        return false; //already exists
    
    let initials_arr = room_name.split(` `);
    let room_div = $(`<div id="${room_id}" class="room-button"  
        data-toggle="collapse" data-target="#sidemenu-room-summary-${room_id}"
        data-roomid="${room_id}">`);
    let full_room_name = $(`<div class="full-chatroom-name">`).append(room_name);
    
    if (room_name.length > 12)
        room_div.addClass(`full-room-minim`);
    
    room_div.append( full_room_name );
        
    if (room_icon_url != null && room_icon_url != "")
    {
        attempt_room_icon(room_div, room_icon_url, initials_arr);
    }
    else
    {
        add_room_initials(room_div, initials_arr);
    }

    room_div.on("click", room_selected);
    $("#chatrooms-div").append(room_div);
    $("#chatrooms-div").append( create_description_div(room_id, room_name, room_info[room_id][__ROOMINFO_CRTR_KEY__]) );

    return true;
}

function attempt_room_icon(div, img_src, initials_arr)
{
    let image = $(`<img class="room-icon">`);
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

function create_description_div(room_id, room_name, room_creator)
{
    let desc_div = $(
        `<div id="sidemenu-room-summary-${room_id}" class="border-top border-bottom border-primary collapse my-2">
            <label for="${room_id}-sidemenu-summary-name" class="small sidemenu-room-summary-label">Roomname:</label>
            <div id="${room_id}-sidemenu-summary-name" class="sidemenu-room-summary-text text-center">${room_name}</div>
            <label for="${room_id}-sidemenu-summary-creator" class="small sidemenu-room-summary-label">Creator:</label>
            <div id="${room_id}-sidemenu-summary-creator" class="sidemenu-room-summary-text text-center">${room_creator}</div>
        </div>`);
    let room_info_btn_div = $(`<div class="text-center">`);
    let room_info_btn = $(`<a class="btn py-0 my-2 btn-outline-primary" data-roomid="${room_id}">`).append("Info").on("click", TODO_show_room_info);
    desc_div.append( room_info_btn_div.append(room_info_btn) );
    desc_div.on("shown.bs.collapse", event => {
        event.currentTarget.scrollIntoView(false, { behavior: "smooth", block: "end" } );
    });
    return desc_div;
}

function TODO_show_room_info(event)
{


    room_selected(event);
    show_modal_room_info(event, view_room_info_modal_prep);

    for (let i=0; i < 10; i++)
        console.log(`*************TODO*TODO_show_room_info***************`)
}

/**
 * A visual alert to the user that the chatroom has been updated in some way that needs
 * attention 
 * @param {*} room_key 
 */
function flash_room_on_menu(room_key)
{
    console.log("flash_room_on_menu:", room_key);
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
    // console.log(event);
    // console.log(event.currentTarget);
    // console.log(event.currentTarget.id);
    current_roomid = event.currentTarget.getAttribute("data-roomid");
    // current_roomid = event.currentTarget.id;
    $(`#${current_roomid}`).removeClass(`has-unread-messages`);
    console.log(current_roomid, $(event.currentTarget).data("roomid"));
    let room_buttons = $(".room-button");
    for (let i=0; i<room_buttons.length; i++)
    {
        $(room_buttons[i]).removeClass("current-room");
    }
    $("#" + current_roomid).addClass("current-room");
    load_room_chat(current_roomid);
}

function load_room_chat(room_id)
{
    console.log("load_room_chat(" + room_id + ")");
    console.log("room_info:");
    console.log(room_info);
    {/**
     * 1 if room exists
     * 2 retrieve reference to root of messages
     * 3 remove alert class if exists
     * 4 load chat messages
    */}

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

/**
 * Function is only concerned with adding the message to the display
 * @param {*} user_id 
 * @param {*} time_stamp 
 * @param {*} message_string 
 */
function add_chatroom_message(user_id, time_stamp, message_string)
{
    console.log("add_chatroom_message :- ", user_id, time_stamp, message_string);
    if (!(user_id in user_profiles))
    {
        //todo change when communicating with remote server
        let user_ref = database.ref("/users/nicks/" + user_id);
        user_ref.once("value").then(
            function(snapshot) {
                //console.log(snapshot.ref.toString(), snapshot.key, snapshot.val());
                let user_root = snapshot.val();
                add_user_profile(user_id, user_root[__USER_INFO_NAME__], 
                    user_root[__USER_INFO_NICK__], user_root[__USER_INFO_PIC__], 
                    user_root[__USER_INFO_BIO__], user_root[__USER_INFO_HOME__]);
                continue_to_add_chatroom_message(user_id, time_stamp, message_string);
            }
        );
    }
    else
        continue_to_add_chatroom_message(user_id, time_stamp, message_string);
}
 
 /**
  * DO NOT CALL, HELPER FUNCTION FOR ANOTHER FUNCTION
  * @param {*} user_id 
  * @param {*} time_stamp 
  * @param {*} message_string 
  */
function continue_to_add_chatroom_message(user_id, time_stamp, message_string)
{
    //console.log("continue_to_add_chatroom_message()", user_id, time_stamp, message_string); 
    let user_css_name = user_profiles[user_id][__USER_PROFILE_CSS__];
    let new_message_id = time_stamp.toString() + "-" + user_id.toString();

    //aids in debugging visually
    // message_string += " " + debug_mangle_timestamp(time_stamp);

    let message_row = $(document.createElement("div")).addClass("row");

    {/**
 0 elements append
    n elements
        found + insert_before_message_row = insertBefore
        found + !insert_before_message_row = append //will be the latest message
        !found + insert_before_message_row = insertBefore //will be the earliest message
        !found + !insert_before_message_row = append //will be the only message or 2nd message
*/

    //TODO insert at correct position
    //traverse the divs that are chidren of chatlog
    //  there will be a div that has the format "user_id-timestamp" extract the timestamp
    //  compare the timestamp to the one being inserted (starting at the end)
    //
    }
    let insert_before_message_row = find_insert_before_point(time_stamp);

    (insert_before_message_row == null) ? $("#chatlog").append(message_row)
                                        : $(message_row).insertBefore( insert_before_message_row );
    
    (user_id == user_uid) ? create_user_message_div(message_row, new_message_id, message_string, user_css_name)
                          : create_other_user_message_div(message_row, user_id, new_message_id, message_string);
    
    $(`#chatlog`)[0].scrollIntoView({behavior: "smooth", block: "end"});
}

function debug_mangle_timestamp(unmangled)
{
    return Math.ceil(parseInt(unmangled) / 1000) % 10000000;
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
            parsed_string += debug_mangle_timestamp(parse_ts) + "\n";
        }
    }
    console.log(parsed_string);
}

function find_insert_before_point(time_stamp)
{
    console.log(`find_insert_before_point`);
    let all_messages = $("#chatlog > div > div.all-messages");
    let insert_before_message_row = null;
    let found = false;
    if (all_messages.length > 0)
    {
        console.log("----");
        debug_print_timestamps(all_messages);

        for (let i=all_messages.length -1; i >=0 && !found; i--)
        {
            let msg_id = all_messages[i].id;
            //prev_msg_id is semantically correct BUT not time correct
            let prev_msg_id = (i == all_messages.length -1) ? "" 
                                                            : all_messages[i+1].id;
            let i_timestamp = parseInt(msg_id.substring(0, msg_id.indexOf("-")));
            console.log(`   timestamp: ${debug_mangle_timestamp(time_stamp)}, i_timestamp: ${debug_mangle_timestamp(i_timestamp)}`);
            found = (parseInt(time_stamp) > parseInt(i_timestamp));
            if (found)
            {
                console.log("   parseInt(time_stamp) > parseInt(i_timestamp)");
                if (prev_msg_id != "") //no previous id means it needs to be added to the bottom of the chatlog as this is only the case for i=length-1
                    insert_before_message_row = $("#" + prev_msg_id).parent();
                console.log("   prev_msg_id:", prev_msg_id, insert_before_message_row);
            }
        }

        if (!found)
            insert_before_message_row = $(`#${all_messages[0].id}`).parent(); //add to the top as it's the lowest value
    }

    return insert_before_message_row
}

function create_user_message_div(dom_elem, msg_id, msg_string, usr_css_name)
{
    console.log(`create_user_message_div(${dom_elem}, ${msg_id}, ${msg_string}, ${usr_css_name})`);
    let div = $(`<div id=${msg_id} class="all-messages this-user-message col-8 ${usr_css_name}">`);
    div.append(msg_string);
    $(dom_elem).append(div);
    $('#' + msg_id).scroll
    return dom_elem;
}

function create_other_user_message_div(dom_elem, other_user_id, msg_id, msg_string)
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
    let msg_uid = $(`<div class="message-name col-10 offset-2">`).append(`by ${user_nickname}`);

    username_row.append(msg_uid);
    //dom_elem.append(username_row);
    username_row.insertAfter(dom_elem);
}


/**
 * When fired, removes the text/value associated with the object that fired the event
 * @param {*} event 
 */
function clear_message_text(event)
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
    let chat_message_content = $("#user-message-text").val();
    
    if (chat_message_content.trim() != "")
        add_message_to_firebase(current_roomid, chat_message_type, chat_message_content);
}

async function create_room_event(event)
{
    let room_name_submitted = $(`#room-create-name`).val().trim();
    let room_logo_submitted = $(`#room-create-logo`).val().trim();
    console.log(`create_room_event`, room_name_submitted, room_logo_submitted);
    let room_key = await firebase_create_chatroom(room_name_submitted, room_logo_submitted);
    user_rooms[room_key] = true;
    await init_user_rooms();
    // await add_room(room_key);
    // add_room_to_menu(room_key);
    let div = $(`<div data-roomid="${room_key}">`);
    div.on("click", room_selected).trigger("click");
    hide_visible_modal();
}

async function update_room_event(event)
{
    let room_id = current_roomid;
    let room_name_submitted = $(`#room-profile-set-name-tf`).val().trim();
    let room_logo_submitted = $(`#room-profile-set-logo-tf`).val().trim();
    await firebase_update_chatroom(room_id, room_name_submitted, room_logo_submitted);
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
function chatlog_scroll_on_breakpoint(event)
{
    if ($(`#chatlog`).length == 1)
        $(`#chatlog`)[0].scrollIntoView({behavior: "smooth", block: "end"});
}