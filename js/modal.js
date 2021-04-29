//these variables are used to store modal info while waiting on another modal to close
//the modal id to open after current modal is closed
let queued_modal_id;
//the prep function to execute before the queued modal is shown
let queued_modal_fx;

/********************
*  MODAL FUNCTIONS  *
********************/

function show_modal(modal_id, prep_function = null)
{
    //TODO replace show_modal(modal_id, prep_function) with show_modal(event)
    //using jQuery on("click", { modal_id : modal_id_value, prep_fx : prep_fx_value}, show_modal)
    //accessing these variables via event.data.modal_id and event.data.prep_fx
    console.log("show_modal() <= ", modal_id, prep_function);
    let old_function = queued_modal_fx;
    modal_id = (modal_id.indexOf("#") == -1) ? "#" + modal_id : modal_id;
    queued_modal_fx = queued_modal_id = null;
    
    if ( visible_modal_exists() )
    {
        queued_modal_id = modal_id;
        queued_modal_fx = prep_function;
        hide_visible_modal(old_function);
    }
    else
    {
        $(modal_id).modal("show");
        remove_modal_body_content(modal_id);
        if (prep_function != null)
            prep_function();
    }
}

function visible_modal_exists()
{
    let return_value = ($(".modal:visible").length > 0);
    console.log("visible_modal_exists", return_value)
    return return_value;
}

function hide_visible_modal(old_function = null)
{
    console.log("hide_visible_modal", old_function);
    console.log($(".modal:visible"));

    $(".modal:visible").each( function(index) {
        if (old_function)
        {
            $(this).off("shown.bs.modal", old_function);
            $(this).off("hidden.bs.modal", old_function);
        }
        $(this).modal("hide");
        $(this).on("hidden.bs.modal", show_queued_modal);
    });
}

/**
 * This function is called every time hide_visible_modal is called. If there is a queued
 * modal then it is shown, otherwise this function just signifies the end of the animation.
 * When a queued modal exists, if there is a queued function that is called when it is
 * shown.
 * @param {*} event 
 */
function show_queued_modal(event)
{
    console.log("show_queued_modal");
    $("#" + event.target.id).off(event.type, show_queued_modal);
    if (queued_modal_id)
    {
        remove_modal_body_content(queued_modal_id); //called now in case the same modal is called one after the other. Looks nicer.
        $(queued_modal_id).modal("show");
        $(queued_modal_id).modal("handleUpdate");
        if (queued_modal_fx)
            queued_modal_fx();
    }
    queued_modal_id = queued_modal_fx = null;
}

//TODO add listeners to modals buttons that don't change

function show_modal_login_email(event = null, prep_function = null)
{
    console.log("show_modal_login_email");
    if (event)
        event.preventDefault();
    show_modal("#email-login-modal", prep_function);
}

function show_modal_signup_email(event = null, prep_function = null)
{
    console.log("show_modal_signup_email");
    if (event)
        event.preventDefault();
    show_modal("#email-signup-modal", prep_function);
}

function show_modal_room_create(event = null, prep_function = null)
{
    console.log("show_modal_room_create");
    if (event)
        event.preventDefault()
    show_modal("#room-create-modal", prep_function);
}

function show_modal_room_info(event = null, prep_function = null)
{
    console.log("show_modal_room_info");
    if (event)
        event.preventDefault()
    show_modal("#view-room-profile-modal", prep_function);
}

function show_modal_user_profile(event = null, prep_function = null)
{
    console.log("show_modal_user_profile");
    if (event)
        event.preventDefault();
    show_modal("#view-user-profile-modal", prep_function)
}

function show_modal_search_users(event = null)
{
    console.log(`show_modal_search_users`);
    if (event)
        event.preventDefault();
    remove_modal_body_content("search-users-modal");
    show_modal("#search-users-modal");
}

/**
 * Will add listeners to modal buttons that are not dynamically created
 */
function init_modal_button_functions()
{
    //email signup
    $("#email-signup-button").on("click", signup_with_email_event);
    $("#email-signup-login-button").on("click", show_modal_login_email);

    //email login
    $("#email-login-button").on("click", login_with_email_event);
    $("#email-login-signup-button").on("click", show_modal_signup_email);

    //TODO
    //room create
    $("#room-create-button").on("click", create_room_event);

    //TODO
    //room view
    //$("#"); no buttons except when editing, those will need to be added on generation

    //TODO
    //user view; no buttons except when editing, those will need to be added on generation
    $("#view-user-profile-modal");

    //TODO
    //search users
    $("#search-users-btn").on("click", search_for_users_event);
} 

function populate_user_profile_modal(snapshot = null)
{
    console.log("populate_user_profile_modal", snapshot);
    let lcl_uid,    lcl_pic_url,    lcl_name,   lcl_nick,
        lcl_home,   lcl_bio,        lcl_rooms,  lcl_contacts;
    
    if (snapshot)
    {
        console.log(snapshot);
        console.log(snapshot.toJSON());
        lcl_uid     = snapshot.ref.key;
        let lcl_json= snapshot.child("info").toJSON();
        lcl_rooms   = snapshot.child("rooms").toJSON();
        lcl_contacts= snapshot.child("contacts").toJSON();
        
        lcl_pic_url = lcl_json[__USER_INFO_PIC__];        lcl_name    = lcl_json[__USER_INFO_NAME__];
        lcl_nick    = lcl_json[__USER_INFO_NICK__];       lcl_home    = lcl_json[__USER_INFO_HOME__];
        lcl_bio     = lcl_json[__USER_INFO_BIO__];    
    }
    else
    {
        lcl_rooms   = user_rooms;
        lcl_contacts= user_contacts;
        console.log(lcl_contacts, user_contacts);
        lcl_uid     = user_uid;                           lcl_pic_url = user_info[__USER_INFO_PIC__];
        lcl_name    = user_info[__USER_INFO_NAME__];      lcl_nick    = user_info[__USER_INFO_NICK__];
        lcl_home    = user_info[__USER_INFO_HOME__];      lcl_bio     = user_info[__USER_INFO_BIO__];
    }

    let u_pic_html, user_image, u_prof_div = $(`<div class="col-12 col-sm-6 p-0 mt-0">`);//, update_div;
    function modal_user_profile_info() 
    {
        console.log("modal_user_profile_info");
        //TODO make fields editable if current_user id is the same as this modals
        //TODO DIVS vs TEXT for u_pic_html
        let img_foot, nick_div, home_div, bio__div, image_load;
        let nick_lbl, home_lbl, bio_lbl;
        if (user_uid != lcl_uid)
        {
            //if not current user, show button to add / delete user
            let is_contact = lcl_uid in user_contacts;
            let profile_btn = $(`<button data-uid="${skel_uid}" class="btn mt-3 w-75">`);
            (is_contact) ? profile_btn.addClass("user-rmv-btn btn-danger").text("Remove")
                         : profile_btn.addClass("user-add-btn btn-info").text("Add");
            profile_btn.on("click", toggle_contact);

            img_foot = $(`<div>`).append(profile_btn);
            nick_lbl = $(`<label for="user-profile-nick" class="mb-0 mt-0">Nick</label>`);
            nick_div = $(`<div id="user-profile-nick" class="text-left text-sm-center"><h4 class="text-uppercase">${lcl_nick}</h4></div`);
            home_lbl = $(`<label for="user-profile-homepage" class="mb-0 mt-2">Homepage</label>`);
            home_div = $(`<div id="user-profile-homepage" class="text-left text-sm-center"><h4><a href="${lcl_home}">Homepage</a></h4></div>`);
            bio_lbl = $(`<label for="user-profile-bio" class="mt-2 mb-0">Bio</label>`);
            bio__div = $(`<div id="user-profile-bio" class="text-left text-sm-center">`).append( 
                            $(`<blockquote class="text-justify blockquote">${lcl_bio}</blockquote>`) );
            u_prof_div.append(nick_lbl, nick_div, home_lbl, home_div, bio_lbl, bio__div);
        }
        else
        {
            let img_link_div = $(`<div class="input-group mt-2">`)
            let img_link_tf  = $(`<input id="user-profile-pic-link" type="text" class="form-control border-primary mt-2" placeholder="Enter URL" value="${lcl_pic_url}">`);
            let img_link_btn_container = $(`<div class="input-group-append">`);
            let img_link_btn = $(`<button id="" class="btn form-control mt-2 btn-primary" data-source="#user-profile-pic-link" data-target="#user-profile-pic">Test</button>`);
            img_link_btn.on("click", preview_image);
            img_link_btn_container.append(img_link_btn);
            img_foot = img_link_div.append(img_link_tf, img_link_btn_container );

            nick_div = $(`<input id="user-profile-nick-tf" type="text" class="form-control" value="${lcl_nick}">`);
            nick_lbl = $(`<label for="user-profile-nick-tf" class="mb-0 pt-3 mt-0">Nick</label>`);
            home_div = $(`<input id="user-profile-homepage-tf" type="text" class="form-control" value="${lcl_home}">`);
            home_lbl = $(`<label for="user-profile-homepage-tf" class="mb-0 mt-2">Homepage</label>`);
            bio__div = $(`<textarea id="user-profile-bio-tf" rows="3" class="text-justify form-control">`).append(lcl_bio);
            bio_lbl = $(`<label for="user-profile-bio-tf" class="mt-2 mb-0">Bio</label>`);
            btn = $(`<button id="" class="btn-primary float-right mt-3 align-content-center btn">Update</button>`).on("click", update_request_from_user_profile_modal); 
            u_prof_div.append(nick_lbl, nick_div, home_lbl, home_div, bio_lbl, bio__div, btn);
        }

        u_pic_html = $(`<div id="user-profile-pic-section" class="col-12 d-flex flex-column pb-3 pb-sm-0 col-sm-6 text-center">`);
        user_image = $(`<div id="user-profile-pic-container" class="my-auto">`);
        image_load = $(`<img id="user-profile-pic" src="${lcl_pic_url}" class="user-profile-pic-img rounded-circle w-75">`);
        
        user_image.append( image_load );

        $(u_pic_html).append(user_image).append(img_foot);
    }

    function modal_user_chatrooms()
    {
        console.log("modal_user_chatrooms");
        let chatrooms_div = $("#user-profile-chatrooms");
        let chatrooms_ul = $(`<div id="user-profile-chatrooms-ul" class="pl-3">`);
        chatrooms_div.append($("<h4>CHATROOMS</h4>"));
        if (lcl_rooms)
        {
            chatrooms_div.append(chatrooms_ul);
            Object.keys(lcl_rooms).forEach(key => {
                let chatroom_li = $(`<div id="room-key-${key}" class="user-profile-chatrooms text-truncate" data-roomid="${key}">`).append(lcl_rooms[key]);
                chatroom_li.on("click", function(event) {
                    room_selected(event);
                    show_modal_room_info(event, view_room_info_modal_prep);
                    // this is where i left off;
                    // 1) set the selected room to see the room info of
                    // 2) create a prep function for the room object
                    // 3) genericize the function call so that it can be used elsewhere providing data-value is set on the object that is the currentTarget
                    // 4) call show_modal_room_info in some way
                    // 5) use load_user_profile(event) from code_playground as a reference

                });
                chatrooms_ul.append( chatroom_li );
                set_text_from_ref(`/rooms/chatrooms/${key}/info/name`, `#room-key-${key}`);
            });
        }
        else
            chatrooms_div.append( $(`<h5 class="text-truncate">`).append("You are not a member of any chatrooms") );
    }

    remove_modal_body_content("view-user-profile-modal");
    
    modal_user_profile_info();
    database.ref("/users/" + lcl_uid + "/contacts").once("value", modal_user_chatrooms);//todo .error() case

    //OKAY Let's build
    //place the name
    $("#view-profile-title").empty().append(lcl_nick);//Header

    console.log(u_pic_html);
    console.log(u_prof_div);
    //put user info together
    $("#user-profile-info").append(u_pic_html, u_prof_div);//.append(update_div);

    //populate contacts
    let modal_contacts = $(`#user-profile-contacts`);
    console.log(lcl_contacts);
    console.log(user_contacts);
    if (lcl_contacts)
    {
        console.log(lcl_contacts);
        Object.keys(lcl_contacts).forEach( key => {
            console.log(key, user_contacts);
            let skel = create_small_user_profile( key );
            modal_contacts.append(skel);

        });
    }
    else
        modal_contacts.append($(`<h5 class="col-12">`).append("No contacts"));
}


/**
 * Event currentTarget needs to be from an element with the fields data-target and data-source
 * set, each pointing to an element with an identifier matching the value.
 * @param {*} event 
 */
function preview_image(event)
{
    console.log("preview_image", event);
    let e_btn = $(event.currentTarget)[0];
    let img_target_id = $(e_btn).data("target");
    let img_tf_id = $(e_btn).data("source");
    console.log(img_target_id, img_tf_id, $(e_btn).data());
    let img_tf = $(img_tf_id)[0];
    let img_target = $(img_target_id)[0];
    let img_tf_text = $(img_tf).val();
    console.log(img_target, img_tf, img_tf_text);
    
    console.log(`new_src ${img_tf_text}`);
    console.log($(img_target).attr("src"));
    $(img_target).attr("src", img_tf_text);
}

async function populate_room_profile_modal(snapshot)
{
    let snapshot_json = snapshot.val();
    let room_name = snapshot_json[__ROOMINFO_NAME_KEY__],
        room_creator_nick_key = snapshot_json[__ROOMINFO_CRTR_KEY__],
        room_logo = snapshot_json[__ROOMINFO_LOGO_KEY__];

    remove_modal_body_content("view-room-profile-modal");

    let is_admin = Boolean(room_creator_nick_key == user_uid);
    $(`#room-profile-view`).show();
    $(`#room-profile-set`).show();
    (is_admin)  ? $(`#room-profile-view`).hide()
                : $(`#room-profile-set`).hide();    
    
    create_room_profile_info();
    create_room_profile_contacts();

    function create_room_profile_info()
    {
        $("#view-room-title").text(room_name);

        if (is_admin)
        {
            let content = $(`<div id="room-profile-set" class="row allow-empty align-items-center">
                    <div class="col-12 col-sm-6 text-center">
                        <div id="room-profile-logo">
                            <img id="room-profile-logo-img" src="${room_logo}" class="room-profile-logo-img w-75">
                        </div>
                    </div>
                    <div class="col-12 col-sm-6 p-0 my-auto">
                        <div id="room-profile-set-name" class="text-left mx-2">
                            <label class="mb-1" for="room-profile-set-name-tf">Room Name:</label>
                            <input id="room-profile-set-name-tf" type="text" class="form-control" placeholder="Enter Room Name" value="${room_name}"/>
                        </div>
                        <div id="room-profile-set-logo" class="text-left mt-2 mx-2">
                            <label class="mb-1" for="room-profile-set-logo-tf">Image source:</label>
                            <div class="input-group">
                                <input id="room-profile-set-logo-tf" type="text" class="form-control text-primary list-group-item-primary" value="${room_logo}" placeholder="Enter URL"/>
                                <div class="input-group-append">
                                    <button id="room-logo-preview-btn" class="btn btn-primary" 
                                        data-source="#room-profile-set-logo-tf" 
                                        data-target="#room-profile-logo-img">Preview</button>
                                </div>
                            </div>
                        </div>
                        <div id="room-profile-update" class="text-center mt-3 mt-sm-2 mt-lg-4">
                            <button id="room-profile-update-btn" class="btn-primary btn form-group text">Submit</button>
                        </div>
                    </div>
                </div>`);
                $(`#room-profile-info`).append(content);

                $(`#room-logo-preview-btn`).on("click", preview_image);
                $(`#room-profile-update-btn`).on("click", update_room_event);
    
        }
        else
        {
            let h4_str = `<h4 id="view-room-profile-creator-nick"></h4>`;
            let need_h4_update = false;
            if (user_profiles.hasOwnProperty(room_creator_nick_key))
                h4_str = `<h4 id="view-room-profile-creator-nick">${user_profiles[room_creator_nick_key][__USER_INFO_NICK__]}</h4>`;
            else
                need_h4_update = true;
            
            let view_profile = $(`<div class="col-12 col-sm-6 text-center">
                    <div id="room-profile-logo">
                        <img src="${room_logo}" class="room-profile-logo-img w-50">
                    </div>
                </div>
                <div class="col-12 col-sm-6 p-0 my-auto">
                    <div id="room-profile-view-name" class="text-center">
                        <h4 class="text-uppercase">${room_name}</h4>
                    </div>
                    <div class="room-profile-creator-nick text-center">
                        ${h4_str}
                    </div>
                </div>`);
            $("#room-profile-info").append(view_profile);

            if (need_h4_update)
                set_text_from_ref(`/users/nicks/${room_creator_nick_key}`, "view-room-profile-creator-nick");
        }
    }

    function create_room_profile_contacts()
    {
        $("#room-profile-contacts").append($(`<h4 class="col-12 text-center">MEMBERS</h4>`));
        database.ref(`/rooms/chatrooms/${snapshot.ref.parent.key}/users`).once("value", snapshot => {
            let users = snapshot.toJSON();
            Object.keys(users).forEach(key => {
                let profile = create_small_user_profile(key);
                $("#room-profile-contacts").append(profile);
            });
        });
    }
}

function create_small_user_profile(skel_uid)
{
    console.log(`create_small_user_profile(${skel_uid})`);
    let is_contact = user_contacts.hasOwnProperty(skel_uid);
    let has_lcl_profile = user_profiles.hasOwnProperty(skel_uid);
    let skel_nick = (has_lcl_profile)   ? user_profiles[skel_uid][__USER_INFO_NICK__]
                                        : false;
    
    let mini_profile_div = $(`<div id="user-profile-${skel_uid}" class="d-flex flex-column col-6 col-sm-4 col-lg-3 py-2 text-center user-small-profile">`);

    let nested_skel_div = $(`<div data-user="${skel_uid}" class="my-auto">`);
    let skel_img = $(`<img id="user-pic-${skel_uid}" src="${__DEFAULT_PROFILE_IMAGE_LINK__}" class="small-profile-glow browse-profile-pic rounded-circle w-75 img-rounded">`);
    nested_skel_div.append(skel_img);

    let nick_and_btn_div = $(`<div class="mx-2">`);
    nick_and_btn_div.append(`<div id="user-nick-${skel_uid}" class="browse-profile-nick text-truncate">${skel_nick}</div>`);
    let contact_btn = $(`<button data-uid="${skel_uid}" class="btn mt-2 w-100">`).on("click", toggle_contact);
    (is_contact) ? contact_btn.addClass("user-rmv-btn btn-danger").text("Remove")
                 : contact_btn.addClass("user-add-btn btn-info").text("Add");

    //This will be made invisible later on if it's the current user's id
    nick_and_btn_div.append(contact_btn);

    let room_invite_div = $(`<div class="btn-group dropup mt-2 mx-2">`);
    let dropdown_menu = $(`<div class="dropdown-menu">`);
    
    Object.keys(room_info).forEach(room_key => {
        let invite_link = $(`<a class="btn dropdown-item" data-user="${skel_uid}" data-room="${room_key}">${room_info[room_key][__ROOMINFO_NAME_KEY__]}</a>`);
        invite_link.on("click", firebase_add_user_to_chatroom_event);
        dropdown_menu.append(invite_link);
    });

    nested_skel_div.on("click", load_user_profile);

    room_invite_div.append($(`<a class="btn btn-info dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Invite</a>`));
    room_invite_div.append(dropdown_menu);

    mini_profile_div.append(nested_skel_div);
    mini_profile_div.append(nick_and_btn_div);
    mini_profile_div.append(room_invite_div);

    if (skel_uid == user_uid)
    {
        contact_btn.css("visibility", "hidden");
        room_invite_div.css("visibility","hidden");
    }
    //fetch nick if needed
    if (skel_nick === false)
        set_text_from_ref(`/users/nicks/${skel_uid}`, `#user-nick-${skel_uid}`);
    
    //image loading
    if (has_lcl_profile)
        loading_small_profile_image(skel_img, user_profiles[skel_uid][__USER_INFO_PIC__]);
    else
        database.ref(`/users/${skel_uid}/info/${__USER_INFO_PIC__}`).once("value", update_small_user_profile_img);

    return mini_profile_div;
}

function update_small_user_profile_img(snapshot)
{
    //TODO  Have the profile pic fade in and out via css on creation, and when it reaches this function
    //      this function will remove the class
    let items = $("#user-pic-" + snapshot.ref.parent.parent.key);
    console.log("update_user_profile_skeleton",snapshot.ref.parent.parent.key, items);
    if (items.length) //0 returns false
    {
        items.each(function(i) {
            loading_small_profile_image(items[i], snapshot.val());
        });
    }
}

function loading_small_profile_image(target, src)
{
    let img = $(`<img>`).one("load", function() {
        console.log("image loaded");
        console.log(target);
        $(target).attr("src", img.attr("src"));
        $(target).removeClass("small-profile-glow");
    }).one("error", function() {
        console.log("image error");
        $(target).removeClass("small-profile-glow");
    }).attr("src", src);
}

//TODO
async function update_request_from_user_profile_modal(event)
{
    let fx_link = $(`#user-profile-pic-link`).val();
    let fx_nick = $(`#user-profile-nick-tf`).val();
    let fx_home = $(`#user-profile-homepage-tf`).val();
    let fx_bio  = $(`#user-profile-bio-tf`).val();

    let fx_user = {};
    let update_obj = {};

    populate_object_field(fx_user, __USER_INFO_PIC__, fx_link, __DEFAULT_PROFILE_IMAGE_LINK__);
    populate_object_field(fx_user, __USER_INFO_NICK__, fx_nick, "No nick");
    populate_object_field(fx_user, __USER_INFO_HOME__, fx_home, "No link");
    populate_object_field(fx_user, __USER_INFO_BIO__, fx_bio, "No bio");

    await update_current_user_info(fx_user);

    queued_view_profile_user_id = user_uid;
    show_modal_user_profile(event, view_user_profile_modal_prep);
}

function search_for_users_event(event)
{
    console.log(`search_for_users_event`);
    var ref = database.ref(`users/user_ids`);
    let tf_id = event.currentTarget.getAttribute("data-source");
    let search_query = $(tf_id).val();
    var query = ref.orderByKey().startAt(search_query).endAt(`${search_query}\uf8ff`);
    //clear results area first
    remove_modal_body_content("#search-users-modal");
    $(`#search-users-results`).empty();
    $(`#search-users-results`).append($(`<h3 class="col-12 text-center mb-3"><b>Search Results</b></h3>`));
    //populate results area
    return query.once('value', snapshot => {
        console.log(snapshot.toJSON());
        let json;
        if (!(json = snapshot.toJSON()))
            return;
        Object.keys(json).forEach(key => {
            Object.keys(json[key]).forEach(key2 => {
                console.log(key, key2, json[key][key2]);
                let inner_thing = create_small_user_profile(key2);
                console.log(inner_thing);
                $("#search-users-results").append(inner_thing);
            });
        });
    });
}

async function toggle_contact(event)
{
    event.stopPropagation();

    let curr_target = event.currentTarget;
    let contact_uid = $(event.currentTarget).data("uid");

    console.log(`toggle_contact(${event}"), uid => ${contact_uid}`);
    console.log(`user-add-btn: ${$(curr_target).hasClass("user-add-btn")}, user-rmv-btn: ${$(curr_target).hasClass("user-rmv-btn")}`);
    // console.log(`${event_id} verbose. 'user-add-' index=${event_id.indexOf("user-add-")}, 'user-rmv-' index=${event_id.indexOf("user-rmv-")}`);
    $(curr_target).removeClass(`btn-info btn-danger`).addClass(`btn-secondary`).attr(`disabled`, true).val(`...`);
    
    if ($(curr_target).hasClass("user-add-btn"))
    {
        await add_contact(contact_uid);
        return $(curr_target).removeClass(`btn-secondary user-add-btn`).addClass(`user-rmv-btn btn-danger`).attr(`disabled`, false).text(`Remove`);
    }
    
    if ($(curr_target).hasClass("user-rmv-btn"))
    {
        await remove_contact(contact_uid);
        return $(curr_target).removeClass(`btn-secondary user-rmv-btn`).addClass(`user-add-btn btn-info`).attr(`disabled`, false).text(`Add`);
    }
    
        return remove_contact(contact_uid);
    
    // throw new Error("modal.js - toggle_contact", `${event_id} is not found at 0. 'user-add-' index=${event_id.indexOf("user-add-")}, 'user-rmv-' index=${event_id.indexOf("user-rmv-")}`);
}

/**
 * Function finds the modal-body from the modal, and any children of that body that
 * contains the identifier ".allow-empty" will have it's children removed. This function
 * will also afterwards search for textfields and reset their values. 
 * @param {*} id_string 
 */
function remove_modal_body_content(id_string)
{
    console.log("remove_modal_body_content", id_string);
    let jquery_id = (id_string.indexOf("#") == -1) ? "#" + id_string : id_string;
    console.log(jquery_id);

    remove_allow_empty_children(`.modal-body`);

    $(jquery_id).find(".modal-body").each(function(index) {
        console.log("each", index);
        $(this).find(':text, :password').each(function (index2) {
            $(this).val("");
            $(this).removeClass("is-invalid");
        });
    });
}
