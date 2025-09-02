// Import existing components we'll reuse
import Dashboard from "views/Dashboard.js";
import Maps from "views/Maps.js";

// Import new components (we'll create these)
import CreatePresent from "views/CreatePresent.js";
import Visite from "views/Visite.js";
import Activity from "views/Activity.js";
import Country from "views/Country.js";
import Province from "views/Province.js";
import Area from "views/Area.js";
import Sales from "views/Sales.js";
import Dali from "views/Dali.js";

// Import management components
import Manager from "views/Manager.js";
import User from "views/User.js";
import UserLogs from "views/UserLogs.js";
import Account from "views/Account.js";

// Import API test component
import ApiConnectionTest from "views/ApiConnectionTest.js";

const dashboardRoutes = [
  // ...existing code...
  // DASHBOARD SECTION
  {
    heading: true,
    name: "DASHBOARD",
    icon: "nc-icon nc-tv-2",
    section: "dashboard"
  },
  // ...existing code...
  {
    path: "/map",
    name: "Map",
    icon: "nc-icon nc-pin-3",
    component: Maps,
    layout: "/admin",
    section: "dashboard"
  },
  
  // TERRITORIES SECTION
  {
    heading: true,
    name: "TERRITORIES",
    icon: "nc-icon nc-world-2",
    section: "territories"
  },
  {
    path: "/country",
    name: "Country",
    icon: "nc-icon nc-globe",
    component: Country,
    layout: "/admin",
    section: "territories"
  },
  {
    path: "/province",
    name: "Province",
    icon: "nc-icon nc-map-big",
    component: Province,
    layout: "/admin",
    section: "territories"
  },
  {
    path: "/area",
    name: "Area",
    icon: "nc-icon nc-square-pin",
    component: Area,
    layout: "/admin",
    section: "territories"
  },
  
  // PRESENTS SECTION
  {
    heading: true,
    name: "VISITE",
    icon: "nc-icon nc-badge",
    section: "presents"
  },
  {
    path: "/present-on-field",
    name: "Stroe-Info",
    icon: "nc-icon nc-simple-add",
    component: Visite,
    layout: "/admin",
    section: "presents"
  },
  
  // ACTIVITIES SECTION
  // ...existing code...
  // ...existing code...
  
  // MANAGEMENT SECTION
  {
    heading: true,
    name: "MANAGER",
    icon: "nc-icon nc-badge",
    section: "management"
  },
  {
    path: "/user",
    name: "User",
    icon: "nc-icon nc-single-02",
    component: User,
    layout: "/admin",
    section: "management"
  },
  {
    path: "/user-logs",
    name: "User Logs",
    icon: "nc-icon nc-single-02",
    component: UserLogs,
    layout: "/admin",
    section: "management"
  },
    {
      path: "/account",
      name: "Account",
      icon: "fa fa-user-circle", // FontAwesome profile icon
      component: Account,
      layout: "/admin",
      section: "management"
    },
  
  // TESTING SECTION
  // ...existing code...
];

export default dashboardRoutes;
