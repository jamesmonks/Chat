## issue #7

## User Deletion

```
rooms ->
    chatrooms ->
        room_id ->
            info ->
                creator : uid
            users ->
                uid : user_nick
            messages ->
                message_id ->
                    user : uid
                    media_msg : text
```

- let user_uid = `KbPD9UuTFIc41NXl9w46cf1XJo22`;
- let jane_doe = `0000000000000000000000000000`;

1) User id is value of rooms.chatrooms.room_id.info.creator *delete*
    ````
    let test_ref = database.ref(`/rooms/chatrooms/`).orderByChild(`info/creator`).equalTo(user_uid);
    test_ref.on("value", snapshot => { test_returned = snapshot;} );
    test_returned.forEach(child => { test_room_arr.push(child.key) });
    let update_obj = {};
    for (let i=0; i < test_room_arr.length; i++)
    {
        update_obj[`/rooms/chatrooms/${test_room_arr[i]}/info/creator`] = jane_doe;
    }
    firebase.database().ref().update(update_obj);
    ````
2) User id is rooms.chatrooms.room_id.users.[uid] *delete*
    1) for (let i=0; i < test_room_arr.length; i++)
        ```
        {
            update_obj[`/rooms/chatrooms/${test_room_arr[i]}/users/${jane_doe}`] = null;
        }
        ```
    - We will not keep any reference to there being a user or a deleted user here
    - Reason: creating many users and then deleting them will fill up the users list
3)  User uid is a value in rooms.chatrooms.room_id.messages.message_id.user
    - Replace this value with the uid of the 'deleted user' (basically a John Doe account)
    ```
    rooms.chatrooms.room_id.messages.message_id.media_msg = "User has been removed"
    rooms.chatrooms.room_id.messages.message_id.media_typ = "Text"
    let rooms_msgs_snapshots = [];
    for (let i=0; i <test_room_arr.length; i++)
    {
        let test_ref2 = database.ref(`/rooms/chatrooms/${test_room_arr[i]}/messages/`).orderByChild(`user`).equalTo(user_uid);
        test_ref2.once("value", snapshot => { rooms_msgs_snapshots[i] = snapshot; } );
    }
    let update_obj = {};
    for (let j=0; j < rooms_msgs_snapshots.length; j++)
    {
        let lcl_room_snapshot = rooms_msgs_snapshots[j];
        lcl_room_snapshot.forEach(child => {
            update_obj[`/rooms/chatrooms/${test_room_arr[j]}/messages/${child.key}/media_typ`] = "text";
            update_obj[`/rooms/chatrooms/${test_room_arr[j]}/messages/${child.key}/media_msg`] = "User message has been removed by System";
        })
        update_obj[`/rooms/chatrooms/${test_room_arr[j]}/messages/`]
    }
    ```
4)  ``` 
    users.nicks.[uid] *delete*
    update_obj[`/users/nicks/${user_uid}`] = null; ```
5)  ```
    users.user_ids.[user_nick].[uid] *delete*
    update_obj[`/users/user_ids/${user_info[__USER_INFO_NICK__]}/${user_uid}`] = null;
    ```
6)  `users.[uid].contacts`
    - Use this to iterate through contacts and delete any self reference in other users
    ````
    let test_ref3 = database.ref(`/users/${user_uid}/contacts`);
    let contacts, contact_uids = [];
    test_ref3.once("value", snapshot => { contacts = snapshot });
    contacts.forEach(child => { contact_uids.push(child.key) } );

    for (let l=0; l < contact_uids.length; l++)
        update_obj[`/users/${contact_uids[l]/contacts/${user_uid}}`] = null;
    ````
7)  `users.[uid]` *delete*
    - Keep this last, as after this we will not be able to retrieve these values to use for searching purposes
