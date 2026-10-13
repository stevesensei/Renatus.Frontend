export {};

declare module 'vue' {
  export interface GlobalComponents {
    Avatar: typeof import('primevue/avatar')['default'];
    Button: typeof import('primevue/button')['default'];
    Checkbox: typeof import('primevue/checkbox')['default'];
    Column: typeof import('primevue/column')['default'];
    DataTable: typeof import('primevue/datatable')['default'];
    Dialog: typeof import('primevue/dialog')['default'];
    InputNumber: typeof import('primevue/inputnumber')['default'];
    InputText: typeof import('primevue/inputtext')['default'];
    Message: typeof import('primevue/message')['default'];
    Password: typeof import('primevue/password')['default'];
    Select: typeof import('primevue/select')['default'];
    Tag: typeof import('primevue/tag')['default'];
    Textarea: typeof import('primevue/textarea')['default'];
    Toast: typeof import('primevue/toast')['default'];
    ToggleSwitch: typeof import('primevue/toggleswitch')['default'];
  }
}
