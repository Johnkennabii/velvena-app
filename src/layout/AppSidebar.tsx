import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Assume these icons are imported from an icon library
import {
  AiIcon,
  BoxCubeIcon,
  CalenderIcon,
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
import { FiUsers } from "react-icons/fi";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import { useAuth } from "../context/AuthContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  new?: boolean;
  requiredRoles?: string[];
  subItems?: {
    name: string;
    path?: string;
    pro?: boolean;
    new?: boolean;
    requiredRoles?: string[];
    isLabel?: boolean;
  }[];
};

const navItems: NavItem[] = [

      {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
    requiredRoles: ["ADMIN", "MANAGER"],
  },
    {
    icon: <PiDress />,
    name: "Catalogue",
    path: "/catalogue",
    requiredRoles: ["ADMIN", "MANAGER", "COLLABORATOR"],
  },
  {
    icon: <CalenderIcon />,
    name: "Calendrier",
    path: "/calendar",
    requiredRoles: ["ADMIN", "MANAGER", "COLLABORATOR"],
  },
    {
    icon: <UserCircleIcon />,
    name: "Clients",
    path: "/customers",
    requiredRoles: ["ADMIN", "MANAGER", "COLLABORATOR"],
  },
  {
    icon: <FiUsers/>,
    name: "Utilisateur",
    path: "/users/list",
    requiredRoles: ["ADMIN", "MANAGER"],
  },


  {
    icon: <PlugInIcon />,
    name: "Gestion",
    requiredRoles: ["ADMIN", "MANAGER"],
    subItems: [
      { name: "Gestion contrat", isLabel: true, requiredRoles: ["ADMIN", "MANAGER"] },
      { name: "Options", path: "/gestion/contract-addons", requiredRoles: ["ADMIN", "MANAGER"] },
      { name: "Forfaits", path: "/gestion/contract-package", requiredRoles: ["ADMIN", "MANAGER"] },
      { name: "Types de contrat", path: "/gestion/contract-types", requiredRoles: ["ADMIN"] },
      { name: "Référence robe", isLabel: true, requiredRoles: ["ADMIN", "MANAGER"] },
      { name: "Types de robe", path: "/gestion/dress-types", requiredRoles: ["ADMIN", "MANAGER"] },
      { name: "Tailles de robe", path: "/gestion/dress-sizes", requiredRoles: ["ADMIN", "MANAGER"] },
      { name: "Etats de robe", path: "/gestion/dress-conditions", requiredRoles: ["ADMIN", "MANAGER"] },
      { name: "Couleurs de robe", path: "/gestion/dress-colors", requiredRoles: ["ADMIN", "MANAGER"] },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Mon profile",
    path: "/profile",
    requiredRoles: ["ADMIN", "MANAGER", "COLLABORATOR"],
  },
  {
    name: "AI Assistant",
    icon: <AiIcon />,
    new: true,
    requiredRoles: ["ADMIN"],
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
    requiredRoles: ["ADMIN"],
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
    requiredRoles: ["ADMIN"],
    subItems: [
      { name: "List", path: "/task-list", pro: true },
      { name: "Kanban", path: "/task-kanban", pro: true },
    ],
  },
  {
    name: "Forms",
    icon: <ListIcon />,
    requiredRoles: ["ADMIN"],
    subItems: [
      { name: "Form Elements", path: "/form-elements", pro: false },
      { name: "Form Layout", path: "/form-layout", pro: true },
    ],
  },
  {
    name: "Tables",
    icon: <TableIcon />,
    requiredRoles: ["ADMIN"],
    subItems: [
      { name: "Basic Tables", path: "/basic-tables", pro: false },
      { name: "Data Tables", path: "/data-tables", pro: true },
    ],
  },
  {
    name: "Pages",
    icon: <PageIcon />,
    requiredRoles: ["ADMIN"],
    subItems: [
      { name: "File Manager", path: "/file-manager" },
      { name: "Pricing Tables", path: "/pricing-tables" },
      { name: "FAQ", path: "/faq" },
      { name: "API Keys", path: "/api-keys", new: true },
      { name: "Integrations", path: "/integrations", new: true },
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
    requiredRoles: ["ADMIN"],
    subItems: [
      { name: "Line Chart", path: "/line-chart", pro: true },
      { name: "Bar Chart", path: "/bar-chart", pro: true },
      { name: "Pie Chart", path: "/pie-chart", pro: true },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    requiredRoles: ["ADMIN"],
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
    requiredRoles: ["ADMIN"],
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
    icon: <ChatIcon />,
    name: "Chat",
    path: "/chat",
    requiredRoles: ["ADMIN"],
  },
  {
    icon: <CallIcon />,
    name: "Support Ticket",
    new: true,
    requiredRoles: ["ADMIN"],
    subItems: [
      { name: "Ticket List", path: "/support-tickets" },
      { name: "Ticket Reply", path: "/support-ticket-reply" },
    ],
  },
  {
    icon: <MailIcon />,
    name: "Email",
    requiredRoles: ["ADMIN"],
    subItems: [
      { name: "Inbox", path: "/inbox" },
      { name: "Details", path: "/inbox-details" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } =
    useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const userRole = user?.role ?? null;

  const canAccess = useCallback(
    (requiredRoles?: string[]) => {
      if (!requiredRoles || requiredRoles.length === 0) return true;
      if (!userRole) return false;
      return requiredRoles.includes(userRole);
    },
    [userRole],
  );

  const filterNavItems = useCallback(
    (items: NavItem[]) =>
      items
        .filter((nav) => canAccess(nav.requiredRoles))
        .map((nav) => {
          if (nav.subItems) {
            const visibleSubItems = nav.subItems.filter((sub) => canAccess(sub.requiredRoles));
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
    [canAccess],
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
        className={`py-8  flex ${
          !isExpanded && !isHovered ? "xl:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
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
