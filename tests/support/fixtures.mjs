export const encryptionKey = Buffer.alloc(32, 7).toString('base64');
export const siteInput = {name: 'Example', domain: 'example.com', url: 'https://example.com', notes: null};
export const fields = [
    {name: 'Username', type: 'text', value: 'alice@example.com'},
    {name: 'Notes', type: 'textarea', value: 'First line\nSecond line'},
    {name: 'Enabled', type: 'boolean', value: true},
    {name: 'Disabled', type: 'boolean', value: false},
    {name: 'Empty', type: 'text', value: null},
];

