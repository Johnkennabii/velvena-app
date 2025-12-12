import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Assume these icons are imported from an icon library
import {
  AiIcon,
  BoxCubeIcon,
  CallIcon,
  CartIcon,
  ChatIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  MailIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  TaskIcon,
  UserCircleIcon,
} from "../icons";
import {  PiDress } from "react-icons/pi";
import { FiUsers , FiUserPlus, FiSettings } from "react-icons/fi";
import { IoCalendarNumberOutline } from "react-icons/io5";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import { useAuth } from "../context/AuthContext";
import { useOrganization } from "../context/OrganizationContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  new?: boolean;
  requiredRoles?: string[];
  requiredFeature?: keyof import("../types/subscription").SubscriptionFeatures;
  subItems?: {
    name: string;
    path?: string;
    pro?: boolean;
    new?: boolean;
    noActive?: boolean;
    requiredRoles?: string[];
    requiredFeature?: keyof import("../types/subscription").SubscriptionFeatures;
    isLabel?: boolean;
  }[];
};

const navItems: NavItem[] = [

      {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
    requiredFeature: "dashboard",
  },
    {
    icon: <PiDress />,
    name: "Catalogue",
    path: "/catalogue",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "COLLABORATOR"],
    requiredFeature: "inventory_management",
  },
  {
    icon: <IoCalendarNumberOutline />,
    name: "Calendrier",
    path: "/calendar",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "COLLABORATOR"],
    requiredFeature: "planning",
  },
    {
    icon: <FiUserPlus />,
    name: "Clients",
    path: "/customers",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "COLLABORATOR"],
    requiredFeature: "customer_portal",
  },
  {
    icon: <HiOutlineUserGroup />,
    name: "Prospects",
    path: "/prospects",
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    requiredFeature: "prospect_management",
  },
  {
    icon: <FiUsers/>,
    name: "Utilisateurs",
    path: "/users/list",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },


  {
    icon: <PlugInIcon />,
    name: "Gestion",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
    subItems: [
      { name: "Gestion contrat", isLabel: true, requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
      { name: "Options", path: "/gestion/contract-addons", requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
      { name: "Forfaits", path: "/gestion/contract-package", requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
      { name: "Types de contrat", path: "/gestion/contract-types", requiredRoles: ["SUPER_ADMIN", "ADMIN"] },
      { name: "Templates de contrat", path: "/gestion/contract-templates", requiredRoles: ["SUPER_ADMIN", "ADMIN","MANAGER"] },
      { name: "Référence robe", isLabel: true, requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
      { name: "Types de robe", path: "/gestion/dress-types", requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
      { name: "Tailles de robe", path: "/gestion/dress-sizes", requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
      { name: "Etats de robe", path: "/gestion/dress-conditions", requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
      { name: "Couleurs de robe", path: "/gestion/dress-colors", requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Mon profile",
    path: "/profile",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "COLLABORATOR"],
  },
  {
    icon: <FiSettings />,
    name: "Paramètres",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "COLLABORATOR"],
    subItems: [
      { name: "Organisation", path: "/settings/organization", requiredRoles: ["SUPER_ADMIN", "ADMIN","MANAGER"] },
      { name: "Facturation", path: "/settings/billing", requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "COLLABORATOR"] },
      { name: "Types de service", path: "/settings/service-types", requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
      { name: "Règles de tarification", path: "/settings/pricing-rules", requiredRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
    ],
  },
  {
    name: "AI Assistant",
    icon: <AiIcon />,
    new: true,
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    subItems: [
      { name: "Text Generator", path: "/text-generator" },
      { name: "Image Generator", path: "/image-generator" },
      { name: "Code Generator", path: "/code-generator" },
      { name: "Video Generator", path: "/video-generator" },
    ],
  },
  {
    name: "E-commerce",
    icon: <CartIcon />,
    new: true,
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    subItems: [
      { name: "Products", path: "/products-list" },
      { name: "Add Product", path: "/add-product" },
      { name: "Billing", path: "/billing" },
      { name: "Invoices", path: "/invoices" },
      { name: "Single Invoice", path: "/single-invoice" },
      { name: "Create Invoice", path: "/create-invoice" },
      { name: "Transactions", path: "/transactions" },
      { name: "Single Transaction", path: "/single-transaction" },
    ],
  },
  {
    name: "Task",
    icon: <TaskIcon />,
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    subItems: [
      { name: "List", path: "/task-list", pro: true },
      { name: "Kanban", path: "/task-kanban", pro: true },
    ],
  },
  {
    name: "Forms",
    icon: <ListIcon />,
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    subItems: [
      { name: "Form Elements", path: "/form-elements", pro: false },
      { name: "Form Layout", path: "/form-layout", pro: true },
    ],
  },
  {
    name: "Tables",
    icon: <TableIcon />,
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    subItems: [
      { name: "Basic Tables", path: "/basic-tables", pro: false },
      { name: "Data Tables", path: "/data-tables", pro: true },
    ],
  },
  {
    name: "Pages",
    icon: <PageIcon />,
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    subItems: [
      { name: "File Manager", path: "/file-manager" },
      { name: "Pricing Tables", path: "/pricing-tables" },
      { name: "FAQ", path: "/faq" },
      { name: "API Keys", path: "/api-keys", new: true },
      { name: "Blank Page", path: "/blank" },
      { name: "404 Error", path: "/error-404" },
      { name: "500 Error", path: "/error-500" },
      { name: "503 Error", path: "/error-503" },
      { name: "Coming Soon", path: "/coming-soon" },
      { name: "Maintenance", path: "/maintenance" },
      { name: "Success", path: "/success" },
    ],
  },

];

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Charts",
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    subItems: [
      { name: "Line Chart", path: "/line-chart", pro: true },
      { name: "Bar Chart", path: "/bar-chart", pro: true },
      { name: "Pie Chart", path: "/pie-chart", pro: true },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    subItems: [
      { name: "Alerts", path: "/alerts", pro: false },
      { name: "Avatar", path: "/avatars", pro: false },
      { name: "Badge", path: "/badge", pro: false },
      { name: "Breadcrumb", path: "/breadcrumb", pro: false },
      { name: "Buttons", path: "/buttons", pro: false },
      { name: "Buttons Group", path: "/buttons-group", pro: false },
      { name: "Cards", path: "/cards", pro: false },
      { name: "Carousel", path: "/carousel", pro: false },
      { name: "Dropdowns", path: "/dropdowns", pro: false },
      { name: "Images", path: "/images", pro: false },
      { name: "Links", path: "/links", pro: false },
      { name: "List", path: "/list", pro: false },
      { name: "Modals", path: "/modals", pro: false },
      { name: "Notification", path: "/notifications", pro: false },
      { name: "Pagination", path: "/pagination", pro: false },
      { name: "Popovers", path: "/popovers", pro: false },
      { name: "Progressbar", path: "/progress-bar", pro: false },
      { name: "Ribbons", path: "/ribbons", pro: false },
      { name: "Spinners", path: "/spinners", pro: false },
      { name: "Tabs", path: "/tabs", pro: false },
      { name: "Tooltips", path: "/tooltips", pro: false },
      { name: "Videos", path: "/videos", pro: false },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    subItems: [
      { name: "Sign In", path: "/signin", pro: false },
      { name: "Sign Up", path: "/signup", pro: false },
      { name: "Reset Password", path: "/reset-password", pro: false },
      {
        name: "Two Step Verification",
        path: "/two-step-verification",
        pro: false,
      },
    ],
  },
];

const supportItems: NavItem[] = [
  {
    name: "E-commerce",
    icon: <PageIcon />,
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    subItems: [
      { name: "Integrations", path: "/integrations", new: true },
    ],
  },
    {
    icon: <MailIcon />,
    name: "Email",
    path: "/inbox",
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    new: true,
  },
  {
    icon: <ChatIcon />,
    name: "Chat",
    path: "/chat",
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    icon: <CallIcon />,
    name: "Support Ticket",
    new: true,
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    subItems: [
      { name: "Ticket List", path: "/support-tickets" , new: true },
      { name: "Ticket Reply", path: "/support-ticket-reply" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } =
    useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const { organization, hasFeature } = useOrganization();
  const userRole = user?.role ?? null;

  const canAccess = useCallback(
    (requiredRoles?: string[]) => {
      if (!requiredRoles || requiredRoles.length === 0) return true;
      if (!userRole) return false;
      return requiredRoles.includes(userRole);
    },
    [userRole],
  );

  const canAccessFeature = useCallback(
    (requiredFeature?: keyof import("../types/subscription").SubscriptionFeatures) => {
      if (!requiredFeature) return true;
      return hasFeature(requiredFeature);
    },
    [hasFeature],
  );

  const filterNavItems = useCallback(
    (items: NavItem[]) =>
      items
        .filter((nav) => canAccess(nav.requiredRoles) && canAccessFeature(nav.requiredFeature))
        .map((nav) => {
          if (nav.subItems) {
            const visibleSubItems = nav.subItems.filter(
              (sub) => canAccess(sub.requiredRoles) && canAccessFeature(sub.requiredFeature)
            );
            return { ...nav, subItems: visibleSubItems };
          }
          return nav;
        })
        .filter((nav) => {
          if (nav.subItems) {
            return nav.subItems.length > 0;
          }
          return true;
        }),
    [canAccess, canAccessFeature],
  );

  const mainMenuItems = useMemo(() => filterNavItems(navItems), [filterNavItems]);
  const supportMenuItems = useMemo(() => filterNavItems(supportItems), [filterNavItems]);
  const othersMenuItems = useMemo(() => filterNavItems(othersItems), [filterNavItems]);
  // Auto-close sidebar on mobile after route change
  useEffect(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "support" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path?: string) => (path ? location.pathname === path : false),
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "support", "others"].forEach((menuType) => {
      const items =
        menuType === "main"
          ? mainMenuItems
          : menuType === "support"
          ? supportMenuItems
          : othersMenuItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (subItem.path && isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "support" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, mainMenuItems, supportMenuItems, othersMenuItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (
    index: number,
    menuType: "main" | "support" | "others"
  ) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (
    items: NavItem[],
    menuType: "main" | "support" | "others"
  ) => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "xl:justify-center"
                  : "xl:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>

              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {nav.new && (isExpanded || isHovered || isMobileOpen) && (
                <span
                  className={`ml-auto absolute right-10 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "menu-dropdown-badge-active"
                      : "menu-dropdown-badge-inactive"
                  } menu-dropdown-badge`}
                >
                  new
                </span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={`${subItem.name}-${subItem.path ?? "label"}`}>
                    {subItem.isLabel ? (
                      <span className="block px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        {subItem.name}
                      </span>
                    ) : (
                      subItem.path && (
                        <Link
                          to={subItem.path}
                          className={`menu-dropdown-item ${
                            isActive(subItem.path)
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {subItem.name}
                          <span className="flex items-center gap-1 ml-auto">
                            {subItem.new && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              >
                                new
                              </span>
                            )}
                            {subItem.pro && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-pro-active"
                                    : "menu-dropdown-badge-pro-inactive"
                                } menu-dropdown-badge-pro`}
                              >
                                pro
                              </span>
                            )}
                                                        {subItem.noActive && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-pro-active"
                                    : "menu-dropdown-badge-pro-inactive"
                                } menu-dropdown-badge-pro`}
                              >
                                Non activé
                              </span>
                            )}
                          </span>
                        </Link>
                      )
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed  flex flex-col  top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        xl:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
<div
  className={`py-8 flex ${
    !isExpanded && !isHovered ? "xl:justify-center" : "justify-start"
  }`}
>
  <Link to="/">
    {organization?.logo_url ? (
      // Si logo_url existe, afficher l'image
      <img
        src={organization.logo_url}
        alt={organization.name}
        className={`object-contain ${
          isExpanded || isHovered || isMobileOpen
            ? "h-12 max-w-[200px]"
            : "h-10 w-10"
        }`}
      />
    ) : (
      // Si pas de logo_url, afficher le nom de l'organisation
      <>
        {isExpanded || isHovered || isMobileOpen ? (
          <span
            className="
              font-[400]
              text-3xl
              tracking-wide
              dark:text-white
              text-gray-900
              select-none
            "
            style={{ fontFamily: '"Great Vibes", cursive' }}
          >
            {organization?.name || "Velvena"}
          </span>
        ) : (
          <span
            className="
              text-xl
              font-[400]
              dark:text-white
              text-gray-900
              select-none
            "
            style={{ fontFamily: '"Great Vibes", cursive' }}
          >
            {organization?.name?.substring(0, 2).toUpperCase() || "VV"}
          </span>
        )}
      </>
    )}
  </Link>
</div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "xl:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(mainMenuItems, "main")}
            </div>
            {supportMenuItems.length > 0 && userRole !== "COLLABORATOR" && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "xl:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Support"
                  ) : (
                    <HorizontaLDots className="size-6" />
                  )}
                </h2>
                {renderMenuItems(supportMenuItems, "support")}
              </div>
            )}
            {othersMenuItems.length > 0 && userRole !== "COLLABORATOR" && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "xl:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Others"
                  ) : (
                    <HorizontaLDots className="size-6" />
                  )}
                </h2>
                {renderMenuItems(othersMenuItems, "others")}
              </div>
            )}
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
