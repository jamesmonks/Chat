/**
 * Function creates a style to be applied to the chat log. This function
 * should only be called by add_user_profile. It should only be called after
 * the user_id is added to the user_profiles object.
 * @param {string} user_id The id of the user
 */
function create_user_style(user_id)
{
    let user_obj = user_profiles[user_id];
    let user_font_color = choose_user_font_color(user_obj[__USER_PROFILE_COLOR__]);
    let dyn_sht = document.getElementById("dynamic-style").sheet;

    dyn_sht.insertRule( `div.all-messages.${user_obj[__USER_PROFILE_CSS__]} {` +
                        `background-color : #${user_obj[__USER_PROFILE_COLOR__]};` +
                        `color : ${user_font_color}; } `);
    dyn_sht.insertRule( `div.speech-bg.${user_obj[__USER_PROFILE_CSS__]} {` +
                        `background-color : #${user_obj[__USER_PROFILE_COLOR__]}; } `);
    dyn_sht.insertRule( `.other-user-msg.${user_obj[__USER_PROFILE_CSS__]}:after {
                        content: "";
                        width: 0px;
                        height: 0px;
                        position: absolute;
                        border-left: 10px solid #${user_obj[__USER_PROFILE_COLOR__]};
                        border-right: 10px solid transparent;
                        border-top: 10px solid #${user_obj[__USER_PROFILE_COLOR__]};
                        border-bottom: 10px solid transparent;
                        right: -10px;
                        top: 0px;
    }`);
}

function choose_user_font_color(hex_color)
{
    if (hex_color.length != 6)
        throw new Error(`choose_user_font_color(${hex_color}) given a non 6 character string`)
    let r_value = parseInt(hex_color.substring(0,2), 16);
    let g_value = parseInt(hex_color.substring(2,4), 16);
    let b_value = parseInt(hex_color.substring(4,6), 16);

    return (r_value < 128 || g_value < 128 || b_value < 128) ? "#EEEEEE" 
                                                             : "#222222";
}
 
/**
 * Function creates the next color to be used for the background of a new user.
 * It is defined by the length of the user_profiles array, so if no new user is added
 * to the user_profiles array, the same color is returned.
 * @returns {string} 6 character string of the background color in base16
 */
function create_next_user_color()
{
    let jump = 48;
    let len  = Object.keys(user_profiles).length;    //get length of user_colors
    let mod  = len % 7;                              //get the value of modulus 7 (increment r, g, b)
    let div  = Math.floor(len/7);
    let base = jump * (1 + div);
    base %= (256 - jump);  //we don't want this value to be less than a jump's distance to 255 as rgb values could dip below 0

    //if value is 0 define new base; 1 -r; 2 -g; 3 -b; 4 -rg; 5 -rb; 6 -gb;
    let r = g = b = base;
    console.log({length : len, modulus : mod, divide_by_7 : div});
    switch (mod){
        case 0 : break;
        case 1 : r += jump; break;
        case 2 : g += jump; break;
        case 3 : b += jump; break;
        case 4 : r += jump; g += jump; break;
        case 5 : r += jump; b += jump; break;
        case 6 : g += jump; b += jump; break;
    }
    r = 256 - r;
    g = 256 - g;
    b = 256 - b;
    let col = r.toString(16) + g.toString(16) + b.toString(16);
    console.log({red : r, green : g, blue : b, hex : col});
    return col;
}

function vars_add_contact(user_key, callback_fx = null)
{
    //1 test if contact already has a profile
    if (user_key in user_contacts)
        return;
    
    user_contacts[user_key] = true; //used only in the view profile screen
    //2 assign if not. I think this is quite large, there may be an ill-defined object's role in user_contacts or elsewhere
    let ref_path = `/users/${user_key}/info`;
    let ref = database.ref(ref_path);
    ref.on("value", received_user_profile);
    register_firebase_listener(ref_path, "value", received_user_profile);
    if (callback_fx)
        callback_fx();
}

function vars_remove_contact(user_key, callback_fx = null)
{
    console.log(`vars_remove_contact(${user_key}, ${callback_fx})`);
    print_user_contacts();
    let new_contacts = {};
    jQuery.each(user_contacts, function(oldkey, oldvalue) {
        console.log(`anonymous key function (${oldkey, oldvalue})`);
        console.log(oldkey, oldkey !== user_key, oldkey != user_key);
        if (oldkey !== user_key)
            new_contacts[oldkey] = oldvalue;
    });
    user_contacts = new_contacts;
    print_user_contacts();
    console.log(`new_contacts:${new_contacts}`);
    if (callback_fx)
        callback_fx();
}

function print_user_contacts()
{
    let str = `user_contacts status: `;
    str += ` instanceof object: ${user_contacts instanceof Object}`;
    str += ` length: ${Object.keys(user_contacts).length}`;
    str += ` keys: ${Object.keys(user_contacts).toString()}`;
    console.log(str);   
}

/**
 * Clears the site's chatrooms and room messages, plus any user specific
 * visual elements.
 * @param {*} event 
 */
 function reset_gui(event = null)
 {
     //TODO
     $("#chat-input-row").hide(400);
     $("#show-create-room-modal-button").hide(400);
     remove_allow_empty_children("#chat-app");
     navigation_setup(false);
 }

/**
 * 
 * @param {*} logged_in 
 */
function navigation_setup(logged_in)
{
    if (logged_in)
    {
        $(`.users-chatrooms-selector`).removeClass(`d-none`).addClass(`d-block`);
        $(`.chat-show-users`).addClass("d-none");
        $(`.chat-show-chatrooms`).one("click", event => { $(`.chat-show-users`).removeClass("d-none"); })
        $(`#sign-in-method-button`).addClass(`d-none`);
        $(`.navbar-toggler`).removeClass(`d-none`).addClass(`d-inline-block`);
        $(`#nav-logged-in`).show(1000);
        $(`#nav-logged-out`).hide();
    }
    else
    {
        $(`.users-chatrooms-selector`).addClass(`d-none`).removeClass(`d-block`);
        $(`#sign-in-method-button`).removeClass(`d-none`);
        $(`.navbar-toggler`).addClass(`d-none`).removeClass(`d-inline-block`);
        $(`#nav-logged-in`).hide();
        $(`#nav-logged-out`).show(1000);
    }
}

/**
 * Function alters the size of the buttons for switching between viewing the chatrooms and
 * viewing the users in a chatroom. The buttons are located in the side navigation of the
 * actual chat app.
 */
function resize_menu_button()
{
    let div_width = $("#chatroom-nav").width();
    console.log("ratio setting")
    let ratio = Math.max(1.25, 1.125);
    $(".users-chatrooms-selector .fa").css( "font-size", div_width * (0.5 * 0.6) / ratio );
}