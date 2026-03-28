import React from "react";
import { assets } from "../../assets/assets";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const sidebarLinks = [
    { name: "Dashboard", path: "/Owner", icon: assets.dashboardIcon },
    { name: "Hotel Mgmt", path: "/Owner/hotel-management", icon: assets.homeIcon },
    { name: "Payment Mgmt", path: "/Owner/payments", icon: assets.totalRevenueIcon },
    { name: "Add Room", path: "/Owner/add-room", icon: assets.addIcon },
    { name: "List Room", path: "/Owner/list-room", icon: assets.listIcon },
    { name: "Exclusive Offers", path: "/Owner/offers", icon: assets.badgeIcon },
  ];

  return (
    <div className="md:w-64 w-16 border-r h-full text-base border-gray-300 pt-4 flex flex-col transition-all duration-300">
      {sidebarLinks.map((item, index) => (
        <NavLink
          to={item.path}
          key={index}
          end={item.path === "/Owner"}
          className={({ isActive }) =>
            `flex items-center py-3 px-4 md:px-8 gap-3 border-r-4 transition-colors duration-200 ${
              isActive
                ? "md:border-r-[6px] border-blue-600 text-blue-600 bg-blue-50"
                : "border-transparent hover:bg-gray-100/90 text-gray-700"
            }`
          }
        >
          <img src={item.icon} alt={item.name} className="h-6 w-6 object-contain shrink-0" />
          <p className="md:block hidden text-left whitespace-nowrap">{item.name}</p>
        </NavLink>
      ))}
    </div>
  );
};

export default Sidebar;
