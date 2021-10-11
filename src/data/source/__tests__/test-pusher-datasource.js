import {PusherDataSource} from "../dk-pusher-datasource";


test("pusher-datasource-xxx", async () => {
    const ds = new PusherDataSource({
        url: 'xxx',
        pusher_channel: 'xxx',
        pusher_key: '...',
    });
    expect(ds).toBeTruthy();
});
