type SidebarItem={label:string;module:ModuleKey;subsection?:string;child?:boolean};
type SidebarGroup={label:string;items:SidebarItem[];alwaysOpen?:boolean};
const sidebarGroups:SidebarGroup[]=[
  {label:'Main',alwaysOpen:true,items:[
    {label:'Dashboard',module:'dashboard'}
  ]},
  {label:'Administration',items:[
    {label:'Access Control',module:'administration'},
    {label:'Users',module:'administration',subsection:'users',child:true},
    {label:'Roles',module:'administration',subsection:'roles',child:true},
    {label:'Staff & HR',module:'staff'},
    {label:'Staff',module:'staff',subsection:'staff',child:true},
    {label:'Payroll',module:'staff',subsection:'payroll',child:true},
    {label:'Leave',module:'staff',subsection:'leave',child:true},
    {label:'Recruitment',module:'staff',subsection:'recruitment',child:true},
    {label:'Settings',module:'administration',subsection:'settings',child:true}
  ]},
  {label:'System Administration',items:[
    {label:'System Administration',module:'system-administration'},
    {label:'Logs',module:'system-administration',subsection:'logs',child:true},
    {label:'Backups',module:'system-administration',subsection:'backups',child:true}
  ]},
  {label:'Academic',items:[
    {label:'Students',module:'students'},
    {label:'Registration',module:'students',subsection:'registration',child:true},
    {label:'Records',module:'students',subsection:'records',child:true},
    {label:'Academic Management',module:'academics'},
    {label:'Timetables',module:'timetable'},
    {label:'Classes',module:'academics',subsection:'classes',child:true},
    {label:'Courses',module:'academics',subsection:'courses',child:true},
    {label:'Health & Clinical',module:'health'},
    {label:'Medical Records',module:'health',subsection:'medical-records',child:true},
    {label:'Clinic',module:'health',subsection:'clinic',child:true},
    {label:'Library',module:'library'}
  ]},
  {label:'Operations',items:[
    {label:'Finance & Accounting',module:'finance'},
    {label:'Attendance',module:'attendance'},
    {label:'Inventory & Property',module:'inventory'}
  ]},
  {label:'Student Affairs',items:[
    {label:'Guild',module:'guild'},
    {label:'Announcements',module:'communication'},
    {label:'Hostel & Welfare',module:'laboratories'}
  ]},
  {label:'Reports',items:[
    {label:'Reports & Analytics',module:'reports'}
  ]}
];