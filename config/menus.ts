import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  List,
  Receipt,
  TrendingUp,
  BookOpen,
  UserCog,
  Factory,
  Fuel,
  HardHat,
  Users,
  ShoppingCart,
  Package,
  Droplet,
  CreditCard,
  Settings,
  ShieldCheck,
  Trash2,
  Lock,
  Sliders,
  Truck,
  ClipboardList,
  FileText,
} from "lucide-react";

export interface MenuItemProps {
  title: string;
  icon: any;
  href?: string;
  child?: MenuItemProps[];
  nested?: MenuItemProps[];
  megaMenu?: MenuItemProps[];
  multi_menu?: MenuItemProps[];
  description?: string;
  onClick?: () => void;
}

const vehicleRentMenu = {
  title: "Vehicle Rent",
  icon: Truck,
  child: [
    // ✅ order: Vehicle Entry -> Logbook Entry -> Vehicle Ledger
    {
      title: "Vehicle Entry",
      icon: PlusCircle,
      href: "/vehicle-rent-entry",
      description: "Add / manage rented vehicle master",
    },
    {
      title: "Logbook Entry",
      icon: ClipboardList,
      href: "/vehicle-logbook-entry",
      description: "Daily log entries (meter, diesel, generated, payment)",
    },
    {
      title: "Vehicle Ledger",
      icon: FileText,
      href: "/vehicle-rent-ledger",
      description: "Ledger view with filters + export",
    },
  ],
};

export const menusConfig = {
  /* =========================
     TOP / MAIN NAV
  ========================= */
  mainNav: [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },

    {
      title: "Site",
      icon: Building2,
      child: [
        { title: "Create New Site", href: "/create-new-site", icon: PlusCircle },
        { title: "All Site List", href: "/all-site-list", icon: List },
        { title: "Site Exp Details", href: "/site-exp", icon: Receipt },
        { title: "Site Profit Data", href: "/site-profit-data", icon: TrendingUp },
      ],
    },

    {
      title: "Ledger",
      icon: BookOpen,
      child: [
        { title: "Create New Ledger", icon: PlusCircle, href: "/create-new-ledger" },
        { title: "All Ledger List", icon: List, href: "/all-ledger" },
        { title: "Staff / Supervisor", icon: UserCog, href: "/staff-ledger" },
        { title: "Material Supplier", icon: Factory, href: "/material-supplier-ledger" },
        { title: "Fuel Station", icon: Fuel, href: "/fuels-ledger" },
        // ✅ Vehicle Rent removed from here (now separate menu)
        { title: "Labour Contractor", icon: HardHat, href: "/labour-contractor-ledger" },
        { title: "Other Party", icon: Users, href: "/party-ledger" },
      ],
    },

    {
      title: "Purchase",
      icon: ShoppingCart,
      child: [
        { title: "Material Purchase", icon: Package, href: "/material-purchase-entry" },
        { title: "Fuels Purchase", icon: Droplet, href: "/fuels-purchase-entry" },
        { title: "Other Party Purchase", icon: Users, href: "/party-purchase-entry" },
      ],
    },

    // ✅ Vehicle Rent menu after Purchase
    vehicleRentMenu,

    {
      title: "Receipt",
      icon: Receipt,
      child: [
        { title: "Department Voucher Entry", href: "/voucher-entry", icon: PlusCircle },
        { title: "Voucher List", href: "/all-voucher-list", icon: List },
        { title: "Party Receipt", href: "/party-reciept", icon: Receipt },
      ],
    },

    {
      title: "Payment",
      icon: CreditCard,
      child: [
        { title: "Payment Entry", href: "/paymentEntry", icon: PlusCircle },
        { title: "Payment List", href: "/all-payment-list", icon: List },
      ],
    },

    {
      title: "Settings",
      icon: Settings,
      child: [
        { title: "Audit Log", href: "/audit-log", icon: ShieldCheck },
        { title: "Deleted Records", href: "/deleted-records", icon: Trash2 },
        { title: "Admin Tools", href: "/admin-tools", icon: Lock },
        { title: "System Settings", href: "/system-settings", icon: Sliders },
      ],
    },
  ],

  /* =========================
     SIDEBAR NAV
  ========================= */
  sidebarNav: {
    modern: [
      { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },

      {
        title: "Site",
        icon: Building2,
        child: [
          { title: "Create New Site", href: "/create-new-site", icon: PlusCircle },
          { title: "All Site List", href: "/all-site-list", icon: List },
          { title: "Site Exp Details", href: "/site-exp", icon: Receipt },
          { title: "Site Profit Data", href: "/site-profit-data", icon: TrendingUp },
        ],
      },

      {
        title: "Ledger",
        icon: BookOpen,
        child: [
          { title: "Create New Ledger", href: "/create-new-ledger", icon: PlusCircle },
          { title: "All Ledger List", href: "/all-ledger", icon: List },
          { title: "Staff / Supervisor", href: "/staff-ledger", icon: UserCog },
          { title: "Material Supplier", href: "/material-supplier-ledger", icon: Factory },
          { title: "Fuel Station", href: "/fuels-ledger", icon: Fuel },
          { title: "Labour Contractor", href: "/labour-contractor-ledger", icon: HardHat },
          { title: "Other Party", href: "/party-ledger", icon: Users },
        ],
      },

      {
        title: "Purchase",
        icon: ShoppingCart,
        child: [
          { title: "Material Purchase", href: "/material-purchase-entry", icon: Package },
          { title: "Fuels Purchase", href: "/fuels-purchase-entry", icon: Droplet },
          { title: "Other Party Purchase", href: "/party-purchase-entry", icon: Users },
        ],
      },

      // ✅ Vehicle Rent after Purchase (modern)
      vehicleRentMenu,

      {
        title: "Receipt",
        icon: Receipt,
        child: [
          { title: "Department Voucher Entry", href: "/voucher-entry", icon: PlusCircle },
          { title: "Voucher List", href: "/all-voucher-list", icon: List },
          { title: "Party Receipt", href: "/party-reciept", icon: Receipt },
        ],
      },

      {
        title: "Payment",
        icon: CreditCard,
        child: [
          { title: "Payment Entry", href: "/paymentEntry", icon: PlusCircle },
          { title: "Payment List", href: "/all-payment-list", icon: List },
        ],
      },

      {
        title: "Settings",
        icon: Settings,
        child: [
          { title: "Audit Log", href: "/audit-log", icon: ShieldCheck },
          { title: "Deleted Records", href: "/deleted-records", icon: Trash2 },
          { title: "Admin Tools", href: "/admin-tools", icon: Lock },
          { title: "System Settings", href: "/system-settings", icon: Sliders },
        ],
      },
    ],

    classic: [
      { isHeader: true, title: "menu" } as any,

      { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },

      {
        title: "Site",
        icon: Building2,
        child: [
          { title: "Create New Site", href: "/create-new-site", icon: PlusCircle },
          { title: "All Site List", href: "/all-site-list", icon: List },
          { title: "Site Exp Details", href: "/site-exp", icon: Receipt },
          { title: "Site Profit Data", href: "/site-profit-data", icon: TrendingUp },
        ],
      },

      {
        title: "Ledger",
        icon: BookOpen,
        child: [
          { title: "Create New Ledger", href: "/create-new-ledger", icon: PlusCircle },
          { title: "All Ledger List", href: "/all-ledger", icon: List },
          { title: "Staff / Supervisor", href: "/staff-ledger", icon: UserCog },
          { title: "Material Supplier", href: "/material-supplier-ledger", icon: Factory },
          { title: "Fuel Station", href: "/fuels-ledger", icon: Fuel },
          { title: "Labour Contractor", href: "/labour-contractor-ledger", icon: HardHat },
          { title: "Other Party", href: "/party-ledger", icon: Users },
        ],
      },

      {
        title: "Purchase",
        icon: ShoppingCart,
        href: "#",
        child: [
          { title: "Material Purchase", href: "/material-purchase-entry", icon: Package },
          { title: "Fuels Purchase", href: "/fuels-purchase-entry", icon: Droplet },
          { title: "Other Party Purchase", href: "/party-purchase-entry", icon: Users },
        ],
      },

      // ✅ Vehicle Rent after Purchase (classic)
      {
        title: vehicleRentMenu.title,
        icon: vehicleRentMenu.icon,
        href: "#",
        child: vehicleRentMenu.child,
      },

      {
        title: "Receipt",
        icon: Receipt,
        child: [
          { title: "Department Voucher Entry", href: "/voucher-entry", icon: PlusCircle },
          { title: "Voucher List", href: "/all-voucher-list", icon: List },
          { title: "Party Receipt", href: "/party-reciept", icon: Receipt },
        ],
      },

      {
        title: "Payment",
        icon: CreditCard,
        child: [
          { title: "Payment Entry", href: "/paymentEntry", icon: PlusCircle },
          { title: "Payment List", href: "/all-payment-list", icon: List },
        ],
      },

      {
        title: "Settings",
        icon: Settings,
        child: [
          { title: "Audit Log", href: "/audit-log", icon: ShieldCheck },
          { title: "Deleted Records", href: "/deleted-records", icon: Trash2 },
          { title: "Admin Tools", href: "/admin-tools", icon: Lock },
          { title: "System Settings", href: "/system-settings", icon: Sliders },
        ],
      },
    ],
  },
};

export type ModernNavType = (typeof menusConfig.sidebarNav.modern)[number];
export type ClassicNavType = (typeof menusConfig.sidebarNav.classic)[number];
export type MainNavType = (typeof menusConfig.mainNav)[number];
