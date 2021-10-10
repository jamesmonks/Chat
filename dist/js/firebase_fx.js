let __FIREBASE_LISTENERS__;

async function update_current_user_info(new_user_info)
{
    console.log("update_current_user_info");
    console.log(new_user_info);

    let update_obj = {};

    if (new_user_info[__USER_INFO_NICK__] != null)
    {
        update_obj["/users/" + user_uid + "/info/" + __USER_INFO_NICK__] = new_user_info[__USER_INFO_NICK__];
        update_obj["/users/nicks/" + user_uid] = new_user_info[__USER_INFO_NICK__];
        let upd1 = "/users/user_ids/" + user_info[__USER_INFO_NICK__] + "/" + user_uid;
        let upd2 = "/users/user_ids/" + new_user_info[__USER_INFO_NICK__] + "/" +user_uid;
        update_obj[upd1] = null;
        update_obj[upd2] = true;
        console.log(upd1, `=null`);
        console.log(upd2, `=true`);
    }
    if (new_user_info[__USER_INFO_NAME__] != null)
        update_obj["/users/" + user_uid + "/info/" + __USER_INFO_NAME__] = new_user_info[__USER_INFO_NAME__];
    if (new_user_info[__USER_INFO_PIC__] != null)
        update_obj["/users/" + user_uid + "/info/" + __USER_INFO_PIC__] = new_user_info[__USER_INFO_PIC__];
    if (new_user_info[__USER_INFO_BIO__] != null)
        update_obj["/users/" + user_uid + "/info/" + __USER_INFO_BIO__] = new_user_info[__USER_INFO_BIO__];
    if (new_user_info[__USER_INFO_HOME__] != null)
        update_obj["/users/" + user_uid + "/info/" + __USER_INFO_HOME__] = new_user_info[__USER_INFO_HOME__];
    console.log(update_obj);

    firebase.database().ref().update(update_obj, function(error) {console.log("error");console.log(error)}).then(function(stuff) {
        console.log("stuff");
        console.log(stuff);
        if (new_user_info[__USER_INFO_NAME__] != null)
            user_info[__USER_INFO_NAME__] = new_user_info[__USER_INFO_NAME__];
        if (new_user_info[__USER_INFO_NICK__] != null)
            user_info[__USER_INFO_NICK__] = new_user_info[__USER_INFO_NICK__];
        if (new_user_info[__USER_INFO_PIC__] != null)
            user_info[__USER_INFO_PIC__] = new_user_info[__USER_INFO_PIC__];
        if (new_user_info[__USER_INFO_BIO__] != null)
            user_info[__USER_INFO_BIO__] = new_user_info[__USER_INFO_BIO__];
        if (new_user_info[__USER_INFO_HOME__] != null)
            user_info[__USER_INFO_HOME__] = new_user_info[__USER_INFO_HOME__];
    }, function(error) {
        console.log(error);
    });
}

// function fetch_user_info(user_id, callback_function)
// {
//     let ref = database.ref("/users/" + user_id + "/info");
//     ref.once("value", callback_function);
// }

async function firebase_add_contact(contact_id)
{
    console.log(`firebase_add_contact(${contact_id}, ${callback_fx})`);
    let ref = database.ref(`users/${user_uid}/contacts/${contact_id}`);    //retrieve the user's nick
    
    (callback_fx) ? ref.set(true).then(callback_fx) : ref.set(true);
}

async function firebase_remove_contact(contact_id, callback_fx = null)
{
    console.log("firebase_remove_contact", contact_id, callback_fx);
    let ref = database.ref(`users/${user_uid}/contacts/${contact_id}`);

    (callback_fx) ? ref.remove().then(callback_fx) : ref.remove();    //if callback function defined
}

/**
 * function listens for changes to a user's info from the firebase database. It only changes
 * values if the user is currently in the local profiles. If not, an error is thrown.
 * @param {*} snapshot 
 */
function firebase_contact_modified(snapshot)
{
    /** TODO **
     * ******
     * 1) add a value listener to each contact listening for any changes
     * 2) have the listener point to this function
     * 3) modify contacts, user_profiles if necessary
     * 4) use below code as a framework
     * 5) edge cases: snapshot is empty, snapshot fields are empty, user_profiles is not set for that user_key
     */

    let user_key = snapshot.parent.key;
    let user_info_root = snapshot.val();

    if (user_info_root)
    {
        if (user_profiles[user_key])
        {
            //what happens if a null value is entered on the firebase server or the snapshot doesn't have this field?
            user_profiles[user_key][ __USER_INFO_NAME__ ] = user_info_root[ __USER_INFO_NAME__ ];
            user_profiles[user_key][ __USER_INFO_NICK__ ] = user_info_root[ __USER_INFO_NICK__ ];
            user_profiles[user_key][ __USER_INFO_PIC__  ] = user_info_root[ __USER_INFO_PIC__  ];
            user_profiles[user_key][ __USER_INFO_BIO__  ] = user_info_root[ __USER_INFO_BIO__  ];
            user_profiles[user_key][ __USER_INFO_HOME__ ] = user_info_root[ __USER_INFO_HOME__ ];
        }
        else
            throw new Error(`user_profiles[${user_key}] does not exist. It must be created before being modified`);
    }
}

async function firebase_create_chatroom(room_name, room_logo)
{
    let key = await database.ref(`rooms/chatrooms`).push().key;
    let msg_key = await database.ref(`rooms/chatrooms/${key}/messages`).push().key;
    let msg_obj = {};
    msg_obj[msg_key] = {
        "user" : user_uid,
        "timestamp" : firebase.database.ServerValue.TIMESTAMP,
        "media_typ" : "text",
        "media_msg" : `${user_profiles[user_uid][__USER_INFO_NICK__]} has opened this channel`
    }
    
    await firebase_edit_chatroom(key, room_name, room_logo, msg_obj);
    return key;
}

async function firebase_edit_chatroom(room_id, room_name, room_logo, msg_object = null)
{
    let updates = {};
    updates[`/rooms/chatrooms/${room_id}/info`] = {
        "name" : room_name,
        "logo" : room_logo,
        "creator" : user_uid
    };
    updates[`/rooms/chatrooms/${room_id}/users/${user_uid}`] = true;
    updates[`/rooms/room_hashes/${room_id}`] = room_name;
    updates[`/users/${user_uid}/rooms/${room_id}`] = true;
    if (msg_object)
        updates[`/rooms/chatrooms/${room_id}/messages`] = msg_object;
    //let ref = database.ref("rooms");
    await database.ref().update(updates);
}

function firebase_add_user_to_chatroom_event(event)
{
    console.log("firebase_add_user_to_chatroom_event");
    let ct = event.currentTarget;
    firebase_add_user_to_chatroom(ct.getAttribute("data-user"), ct.getAttribute("data-room"));
}

async function firebase_add_user_to_chatroom(user_id, chatroom_id, callback_fx = null)
{
    console.log(`firebase_add_user_to_chatroom(${user_id}, ${chatroom_id})`);
    let add2chat = {};
    add2chat[`rooms/chatrooms/${chatroom_id}/users/${user_id}`] = true;
    add2chat[`users/${user_id}/rooms/${chatroom_id}`] = true;
    database.ref().update(add2chat, error => {
        if (error)
            return false;
        else
        {
            if (callback_fx)
                callback_fx(); 
            return true;
        }
    });
}

async function firebase_get_room_info(room_id)
{
    //todo #9 add room info updates in real time
    console.log(`firebase_get_room_info(${room_id})`);
    let ref1 = database.ref(`rooms/chatrooms/${room_id}/info`);
    let ref2 = database.ref(`rooms/chatrooms/${room_id}/users`);
    let fb_room_info = await ref1.once("value");
    let fb_room_users = await ref2.once("value");
    fb_room_info = fb_room_info.val();
    fb_room_users = fb_room_users.val();
    console.log(`fb_room_info: ${fb_room_info}`);
    console.log(`fb_room_users: ${fb_room_users}`);

    let obj = {};
    obj[__ROOMINFO_NAME_KEY__]  = fb_room_info[__ROOMINFO_NAME_KEY__];
    obj[__ROOMINFO_CRTR_KEY__]  = fb_room_info[__ROOMINFO_CRTR_KEY__];
    obj[__ROOMINFO_LOGO_KEY__]  = fb_room_info[__ROOMINFO_LOGO_KEY__];
    obj[__ROOMINFO_USRS_KEY__]  = Object.keys(fb_room_users);
    console.log(`obj[${__ROOMINFO_USRS_KEY__}]= ${obj[__ROOMINFO_USRS_KEY__]}`);

    return obj;
}

function firebase_add_room_listener(room_id)
{
    let ref1 = database.ref(`rooms/chatrooms/${room_id}/info`);
    let ref2 = database.ref(`rooms/chatrooms/${room_id}/users`);
    ref1.on("child_changed", (snapshot) => {modify_chatroom_values(snapshot, "child_changed")});
    ref2.on("child_added", modify_chatroom_user_list);
}



async function firebase_get_room_messages(room_id, callback_function = null)
{

}

async function add_message_to_firebase(room_id, msg_type, content) {
    database.ref(`/rooms/chatrooms/${room_id}/messages`).push( {
        "user" : user_uid,
        "timestamp" : firebase.database.ServerValue.TIMESTAMP,
        "media_typ" : msg_type,
        "media_msg" : content
    });
}

/**
 * Function establishes a connection to the Firebase app
 */
function connect_to_firebase()
{
    // Initialize Firebase
    firebase.initializeApp({
        apiKey: "AIzaSyD5z0Ul3RHeFlfkkHJxUJSXxjyCssuyvQg",
        authDomain: "noodlemessager.firebaseapp.com",
        databaseURL: "https://noodlemessager-default-rtdb.firebaseio.com",
        projectId: "noodlemessager",
        storageBucket: "noodlemessager.appspot.com",
        messagingSenderId: "797233813077",
        appId: "1:797233813077:web:094f137d99b9971462a6dc"
    });
    database = firebase.database();
    auth = firebase.auth();
}

 /**
 * 
 * @param {*} snapshot snapshot of the message data that was added
 * @param {*} prev_key the previous message's key
 */
function message_received(snapshot, prev_key)
{
    let valid = true;
    let debug = false;
    //todo validity checks
    // console.log("message_received()");
    if (debug)
        console.log(snapshot.ref.key, snapshot.toJSON());
    if (valid)
    {
        let room_key = snapshot.ref.parent.parent.key.toString();
        let msg_key = snapshot.ref.key;
        let room_obj = room_info[room_key];

        if (debug)
            console.log(`room_key, msg_key(${room_key}, ${msg_key})`);
        
        if (! room_obj.hasOwnProperty(__ROOMINFO_MSGS_KEY__) )
            room_obj[__ROOMINFO_MSGS_KEY__] = {};
        let room_msgs = room_obj[__ROOMINFO_MSGS_KEY__];
        
        if (debug)
            console.log(`room_info[${room_key}][${__ROOMINFO_MSGS_KEY__}]= ${room_msgs}`);

        room_msgs[msg_key] = snapshot.toJSON();

        if (room_key != current_roomid)
            flash_room_on_menu(room_key);
        //todo test
        if (room_key == current_roomid)
        {
            let room_message = room_msgs[msg_key];
            if (debug)
                console.log("message received and roomkey is currentroom");
            add_chatroom_message(room_message[__MSG_USER_KEY__], room_message[__MSG_TIME_KEY__], room_message[__MSG_TEXT_KEY__]);
        }

    }
}

async function firebase_setup_new_user(success_callback, failure_callback)
{
    console.log(`firebase_setup_new_user()`);
    if (_new_user)
    {
        _new_user = false;
        //do stuff here
        let update_obj = firebase_initial_user_values_object();
        console.log(update_obj);
        database.ref().update(update_obj).then(success_callback).catch(err_value => {
            failure_callback(err_value);
        });
    }
    else
        user_login_complete();
}

function firebase_initial_user_values_object() 
{
    let update_obj = {};
    let user_nick = __DEFAULT_USER_INFO[__USER_INFO_NICK__];
    update_obj[`/users/${user_uid}/info`] = __DEFAULT_USER_INFO;
    update_obj[`/users/nicks/${user_uid}`] = user_nick;
    update_obj[`/users/user_ids/${user_nick}/${user_uid}`] = true;
    return update_obj;
}

async function register_firebase_listener(reference, event_type = null, fx = null)
{
    if (! __FIREBASE_LISTENERS__)
        __FIREBASE_LISTENERS__ = [];
    __FIREBASE_LISTENERS__.push([reference, event_type, fx]);
}

async function delete_user()
{
    let update_obj = {},
        jane_doe = `0000000000000000000000000000`,
        all_data_retrieved = true,
        rooms_keys = [];
        errors = [];

    // 01) user_uid is value of rooms.chatrooms.room_id.info.creator *replace with jane_doe*
    async function del01_get_creatorship_rooms(obj)
    {
        console.log("doing 01")
        await database.ref(`/rooms/chatrooms/`)
                    .orderByChild(`info/creator`)
                    .equalTo(user_uid)
                    .once("value")
                    .then(snapshot => {  
                        snapshot.forEach(child => { obj[`/rooms/chatrooms/${child.key}/info/creator`] = jane_doe });
                        console.log("done 01")                })
                    .catch( error => { all_data_retrieved = false; errors.push(error)});
        return obj;
    }
    
    
    // 02) user_uid is in chatroom users => rooms.chatrooms.room_id.users.[user_uid] *delete*
    async function del02_get_membership_rooms(obj)
    {
        console.log("doing 02");
        await database.ref(`/users/${user_uid}/rooms`)
                    .once("value")
                    .then(snapshot => {
                        users_rooms = snapshot;
                        snapshot.forEach(child => {
                            rooms_keys.push(child.key);
                            obj[`/rooms/chatrooms/${child.key}/users/${user_uid}`] = null; //delete user
                            obj[`/rooms/chatrooms/${child.key}/users/${jane_doe}`] = true; //make new user for deleted
                        });
                        console.log("done 02")  })
                    .catch( error => { all_data_retrieved = false; errors.push(error) } );
        return obj;
    }
        
    
    // We will not keep any reference to there being a user or a deleted user here
    // Reason: creating many users and then deleting them will fill up the users list

    // 03) User uid is a value in rooms.chatrooms.room_id.messages.message_id.user
    // Replace this value with the uid of the 'deleted user' (basically a John Doe account)
    // rooms.chatrooms.room_id.messages.message_id.media_msg = "User has been removed"
    // rooms.chatrooms.room_id.messages.message_id.media_typ = "Text"
    // let rooms_msgs_snapshots = [];
    
    async function del03_get_all_messages(obj)
    {
        console.log("doing 03");
        for (let i=0; i < rooms_keys.length; i++)
        {
            let room_key = rooms_keys[i];
            await database.ref(`/rooms/chatrooms/${room_key}/messages/`)
            .orderByChild(`user`)
            .equalTo(user_uid)
            .once("value")
            .then(
                snapshot => 
                { 
                    // rooms_msgs_snapshots[child.key] = snapshot; 
                    snapshot.forEach( (msg) => 
                    {
                        let chatroom_key = room_key,
                        msg_key = msg.key;
                        console.log(msg, chatroom_key, msg_key);
                        obj[`/rooms/chatrooms/${chatroom_key}/messages/${msg_key}/user`] = jane_doe;
                        obj[`/rooms/chatrooms/${chatroom_key}/messages/${msg_key}/media_typ`] = "text";
                        obj[`/rooms/chatrooms/${chatroom_key}/messages/${msg_key}/media_msg`] = "User message has been removed by System";
                        console.log("message made");
                    } );
                }
            )
            .catch( error => { all_data_retrieved = false; errors.push(error) } );
            console.log("done 03");
        };
        console.log("after 03");
        return obj;
    }

    // for (let i=0; i <test_room_arr.length; i++)
    // {
    //     let test_ref2 = database.ref(`/rooms/chatrooms/${test_room_arr[i]}/messages/`).orderByChild(`user`).equalTo(user_uid);
    //     test_ref2.once("value", snapshot => { rooms_msgs_snapshots[i] = snapshot; } );
    // }
    
// 04) users.[uid].contacts <== Use this to iterate through contacts and delete any self reference in other users
    async function del04_get_contacts(obj)
    {
        console.log("doing 04")
        await database.ref(`/users/${user_uid}/contacts`)
            .once("value")
            .then( snapshot => { snapshot.forEach(child => { obj[`/users/${child.key}/contacts/${user_uid}`] = null }); console.log("done 04")})
            .catch( error => { all_data_retrieved = false; errors.push(error) } );
        return obj;
    }

    function del05_other_cleanup(obj)
    {
        // 05) users.nicks.[uid] *delete*
        obj[`/users/nicks/${user_uid}`] = null;
        // 06) users.user_ids.[user_nick].[uid] *delete*
        obj[`/users/user_ids/${user_info[__USER_INFO_NICK__]}/${user_uid}`] = null;
        // 07) users.[uid] *delete*
        // update_obj[`/users/${user_uid}`] = null;
        // Keep this last, as after this we will not be able to retrieve these values to use for searching purposes
    }

    await del01_get_creatorship_rooms(update_obj);
    await del02_get_membership_rooms(update_obj);
    await del03_get_all_messages(update_obj);
    await del04_get_contacts(update_obj);
    del05_other_cleanup(update_obj);

// 07) users.[uid] *delete*
    // update_obj[`/users/${user_uid}`] = null;
    // Keep this last, as after this we will not be able to retrieve these values to use for searching purposes
// 08) execute
    unregister_firebase_listeners();
    console.log(JSON.stringify(update_obj));
    if (all_data_retrieved)
        firebase.database().ref().update(update_obj);//.then(signout()).catch( error => { errors.push(error) } );
    
    if (errors.length > 0)
    {
        show_error_modal("<h3>Unable to delete user</h3>", `<p>We are unable to delete your account at this time. Please
            contact the admin directly via e-mail</p><p>Apologies for the inconvenience</p>`);
        errors.forEach(error => { console.log(error) });
    }
        
    //todo #7
    // 1) get user's rooms
    // 2) get comments by user in those rooms and rooms where user is the creator
        //chatrooms/roomid/messages/msg_id/user = user_uid
        //chatrooms/roomid/info/creator = user_uid
        //with messages, don't forget to add an index
        //https://stackoverflow.com/questions/40471284/firebase-search-by-child-value
    // 3) set userid to null in users/nicks
    // 4) set user's id to null in users/user_ids/nick
    // 5) from 1), set chatrooms/roomid/users/user_uid to null
    // 6) from 2), set chatrooms/roomid/messages/msg_id/media_msg to "user deleted"
    // 7) from 2), set chatrooms/roomid/messages/msg_id/user to "User Deleted"
    // 8) from 2), remove chatrooms/roomid
}

function unregister_firebase_listeners()
{
    if (__FIREBASE_LISTENERS__)
    {
        for (let i=0; i < __FIREBASE_LISTENERS__.length; i++)
        {
            let reference = database.ref(__FIREBASE_LISTENERS__[i][0]);
            let event_type = __FIREBASE_LISTENERS__[i][1];
            let fx = __FIREBASE_LISTENERS__[i][2];

            remove_firebase_listener(reference, event_type, fx);
        }
    }
    function remove_firebase_listener(reference, event_type, fx) {
        if (event_type == null)
            return reference.off();
        if (fx == null)
            return reference.off(event_type);
        
        reference.off(event_type, fx);
    }
}