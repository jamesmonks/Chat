var MSG_TEXT = "text";
var MSG_IMAGE= "image";
var MSG_LINK = "link";
var MSG_EMOJI= "emoji";

//TODO
function process_message(message, message_type)
{
    message = safe_message();
    switch (message_type)
    {
        case MSG_TEXT : 
                        break;
        case MSG_IMAGE: break;
        case MSG_LINK : break;
        case MSG_EMOJI: break;
        default: break;
    }
    return message;
}

//TODO
function get_emoji_html(emoji)
{
    let emoji_filename;
    switch (emoji)
    {
        default :   emoji_filename = "emoji.jpg";
                    break;
    }
    let emoji_html = "<img src=\"./" + emoji_filename + "\" />";
    return emoji_html;
}

//TODO
function safe_message(message)
{
    return message;
}