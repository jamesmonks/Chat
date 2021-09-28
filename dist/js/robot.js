let _ROBOT_RESPONSE_ = "response";

let _ROBOT_RESPONSE_ID_ = "id";
let _ROBOT_RESPONSE_DESCRIPTION_ = "description";
let _ROBOT_RESPONSE_STATEMENTS_ = "statements";
let _ROBOT_RESPONSE_OPTIONS_ = "options";

let _ROBOT_STATEMENT_TYPE_ = "type";
let _ROBOT_STATEMENT_DATA_ = "data";

let _ROBOT_STATEMENT_TYPE__TEXT_ = "text";
let _ROBOT_STATEMENT_TYPE__QUESTION_ = "question";
let _ROBOT_STATEMENT_TYPE__ANSWER_ = "answer";
let _ROBOT_STATEMENT_TYPE__OPTION_ = "option";

let _STATEMENT_TYPES_ = [_ROBOT_STATEMENT_TYPE__TEXT_, _ROBOT_STATEMENT_TYPE__QUESTION_, _ROBOT_STATEMENT_TYPE__ANSWER_, _ROBOT_STATEMENT_TYPE__OPTION_];

let _ROBOT_DIALOG_;
let _ROBOT_UID_;
let _ROBOT_ROOM_ID_ = "robot_help"


function chatbot_init()
{
    generate_responses();
    setup_robot();
    setup_robot_room();
}

function generate_responses()
{
    add_response_to_chatbot("d001", "intro_001", "Welcome",
        [
            create_response_statement_object(_ROBOT_STATEMENT_TYPE__TEXT_, "Welcome to my chat app"),
            create_response_statement_object(_ROBOT_STATEMENT_TYPE__TEXT_, "I'm a robot, you can click on any 'Option' chat bubbles. With that said ..."),
            create_response_statement_object(_ROBOT_STATEMENT_TYPE__QUESTION_, "Can I help you with the following?")
        ],
        ["d002", "d003"]);
    
    add_response_to_chatbot("d002", "rooms_001", "Rooms", 
        [
            create_response_statement_object(_ROBOT_STATEMENT_TYPE__TEXT_, "You can create, edit and add rooms ..."),
            create_response_statement_object(_ROBOT_STATEMENT_TYPE__TEXT_, "For existing rooms you are not a member of, a user has to add you ..."),
            create_response_statement_object(_ROBOT_STATEMENT_TYPE__ANSWER_, "This is an answer")
        ],
        ["d001", "d003"]);
    add_response_to_chatbot("d003", "contacts_001", "Contacts",
        [
            create_response_statement_object(_ROBOT_STATEMENT_TYPE__ANSWER_, "You can search for contacts by clicking the button on the top right and then selecting the 'Find Contacts' menu option"),
            create_response_statement_object(_ROBOT_STATEMENT_TYPE__ANSWER_, "Just enter the user's Nickname and select 'Search'"),
            create_response_statement_object(_ROBOT_STATEMENT_TYPE__ANSWER_, "If any users are found, tou can add the user to your friends list by clicking on the add button"),
            create_response_statement_object(_ROBOT_STATEMENT_TYPE__QUESTION_, "Is there anything else I can help you with?")
        ],
        ["d001", "d002"]);
}

function setup_robot()
{
    _ROBOT_UID_ = "robot_" + user_uid;
    //add robot as a user
    add_user_profile(_ROBOT_UID_, "Mr. Robot", "Mr. Robot", "./images/robot.png", 
                    "Long hours, existing under global robo-oppression", 
                    "www.wolframalpha.com");
}

async function setup_robot_room()
{
    //create a room
    add_non_firebase_room(_ROBOT_ROOM_ID_, "Help", user_uid, 
    __DEFAULT_ROOM_IMAGE_LINK__, [user_uid, _ROBOT_UID_]);
    //add room to menu
    let room = await add_room_to_menu(_ROBOT_ROOM_ID_);
    room.on("click", event => { send_robot_response("d001"); })
    //send a message to the room
    send_robot_response("d001");
}

async function send_robot_response(response_id)
{
    if (!(response_id in _ROBOT_DIALOG_))
        throw new Error(`no such response_id: ${response_id}`);

    let statements = _ROBOT_DIALOG_[response_id][_ROBOT_RESPONSE_STATEMENTS_];
    let options = _ROBOT_DIALOG_[response_id][_ROBOT_RESPONSE_OPTIONS_];
    let i, css_style, text, elem, option_response_id;

    if (statements)
        for (i=0; i < statements.length; i++)
        {
            let type = statements[i][_ROBOT_STATEMENT_TYPE_];
            css_style = get_statement_css_classname(type);
            text = statements[i][_ROBOT_STATEMENT_DATA_];
            elem = await add_chatroom_message(_ROBOT_UID_, (new Date()).getTime(), text);
            $(elem).children(".other-user-msg").addClass(css_style);
        }
    
    if (options)
        for (i=0; i < options.length; i++)
        {
            option_response_id = options[i];
            css_style = get_statement_css_classname(_ROBOT_STATEMENT_TYPE__OPTION_);
            text = _ROBOT_DIALOG_[option_response_id][_ROBOT_RESPONSE_DESCRIPTION_];
            elem = await add_chatroom_message(_ROBOT_UID_, (new Date()).getTime(), text);
            elem.children(".other-user-msg").addClass(css_style)
                .attr("data-option-response-id", option_response_id)
                .on("click", event => send_robot_response( $(event.currentTarget).attr("data-option-response-id")));
        }
}

async function send_robot_response(response_id)
{
    if (!(response_id in _ROBOT_DIALOG_))
        throw new Error(`no such response_id: ${response_id}`);

    let statements = _ROBOT_DIALOG_[response_id][_ROBOT_RESPONSE_STATEMENTS_];
    let options = _ROBOT_DIALOG_[response_id][_ROBOT_RESPONSE_OPTIONS_];
    let i, css_style, text, elem, option_response_id;

    if (statements)
        for (i=0; i < statements.length; i++)
        {
            let type = statements[i][_ROBOT_STATEMENT_TYPE_];
            css_style = get_statement_css_classname(type);
            text = statements[i][_ROBOT_STATEMENT_DATA_];
            elem = await add_chatroom_message(_ROBOT_UID_, (new Date()).getTime(), text);
            $(elem).children(".other-user-msg").addClass(css_style);
        }
    
    if (options)
        for (i=0; i < options.length; i++)
        {
            option_response_id = options[i];
            css_style = get_statement_css_classname(_ROBOT_STATEMENT_TYPE__OPTION_);
            text = _ROBOT_DIALOG_[option_response_id][_ROBOT_RESPONSE_DESCRIPTION_];
            elem = await add_chatroom_message(_ROBOT_UID_, (new Date()).getTime(), text);
            elem.children(".other-user-msg").addClass(css_style)
                .attr("data-option-response-id", option_response_id)
                .on("click", event => {
                    let prev_messages = $(`#chatlog`).children();
                    for (let i=0; i < prev_messages.length; i++)
                    {
                        let child_elem = $(prev_messages[i]);
                        let child_height = child_elem.height();
                        console.log(child_height + "px");
                        child_elem.css(`opacity`, `0`)
                                  .one('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function(event) {
                                            console.log("zero alpha");
                                            $(event.currentTarget).css(`height`, `0px`);
                                        });
                    }
                    //send this user message
                    let curr_obj = $(event.currentTarget);
                    // $(`#chatlog`).empty();
                    add_chatroom_message(user_uid, (new Date()).getTime(), `Tell me about: "${curr_obj.html()}"`);
                    send_robot_response( curr_obj.attr("data-option-response-id") );
                });
        }
}

function get_statement_css_classname(type)
{
    let css_class;
    switch (type)
    {
        case _ROBOT_STATEMENT_TYPE__ANSWER_ :   //italic
            css_class = "robot-answer";                     
            break;
        case _ROBOT_STATEMENT_TYPE__QUESTION_ : //bold
            css_class = "robot-question";                     
            break;
        case _ROBOT_STATEMENT_TYPE__OPTION_ :   //hover effect on text
            css_class = "robot-option";                     
            break;
        case _ROBOT_STATEMENT_TYPE__TEXT_ :     //normal
        default :                               //normal
            css_class = "robot-default";
            break;
    }
    return css_class;
}

//responsible for building the chat robot 

function add_response_to_chatbot(response_id, debug_id, description, statements, options)
{
    console.log(response_id, debug_id, description, statements.length, options.length);
    let proceed = false;
    if (response_id && description && statements && options)
        if ( (response_id instanceof String || typeof response_id === "string") && (description instanceof String || typeof description === "string") )
            if ( Array.isArray(statements) && Array.isArray(options) )
                proceed = true;
    if (!proceed)
    {
        console.log(response_id instanceof String, typeof response_id === "string", typeof response_id);
        console.log(description instanceof String, typeof description === "string", typeof description);
        let str = `response_id : ${response_id}, debug_id : ${debug_id}, description : ${description}, statements : ${statements}, options : ${options}.`;
        let err = new Error(`"ROBOT response error with the following args"\n${str}`);
        throw err;
    }
    let obj = {};
    obj[_ROBOT_RESPONSE_ID_] = debug_id; //not really needed, but good for debugging, give this an id/name that is descriptive for debugging/navigational purposes
    obj[_ROBOT_RESPONSE_DESCRIPTION_] = description;
    obj[_ROBOT_RESPONSE_STATEMENTS_] = statements;
    obj[_ROBOT_RESPONSE_OPTIONS_] = options;

    if (!(_ROBOT_DIALOG_))
        _ROBOT_DIALOG_ = {};
    
    _ROBOT_DIALOG_[response_id] = obj;
}

/**
 * Creates a response object and adds it to the provided array argument
 * @param {*} type The type of response object
 * @param {*} data The data to be shown to the user
 * @returns An object formatted for the chatbot
 */
function create_response_statement_object(type, data)
{
    if (_STATEMENT_TYPES_.includes(type))
    {
        if ((typeof data === 'string' || data instanceof String) && data != "")
        {
            let obj = {};
            obj[_ROBOT_STATEMENT_TYPE_] = type;
            obj[_ROBOT_STATEMENT_DATA_] = data;
            return obj;
        }
        else
        {
            console.log(typeof data === 'string', data instanceof String);
            console.log(data != "");
            throw new Error(`create_response_statement_object(${type}, '${data}') 2nd arg 'data' needs to be an non empty string, '${data}' given`);
        }
    }
    else
        throw new Error(`create_response_statement_object('${type}', '${data}'), 1st argument was not of type: + ${_STATEMENT_TYPES_.toString()}`);
}



// basic structure

// each response has a statement array, which can have text, questions or answers.
// each response has an option array, which links to other responses

// r
//     s
//     o -> r

//  -> o
// o -> 

// q -> o   1...n
// o -> q|a 1...n
// a -> text

// JSON [id]
//     id 1                    int
//     description 1           string <-- used for short descriptions
//     statement {
//         type                text|question|answer    <-- used for styling or adding links
//         data                string
//     }
//     options {
//         i : id 0..n
//     } 