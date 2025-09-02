import * as React from "react";
import * as Icons from "react-icons/ai";
import * as BiIcons from "react-icons/bi";
import * as BsIcons from "react-icons/bs";
import * as FaIcons from "react-icons/fa";
import * as FiIcons from "react-icons/fi";
import * as HiIcons from "react-icons/hi";
import * as IoIcons from "react-icons/io5";
import * as MdIcons from "react-icons/md";
import * as RiIcons from "react-icons/ri";
import * as TbIcons from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Combine all icon sets
const allIcons = {
  ...Icons,
  ...BiIcons,
  ...BsIcons,
  ...FaIcons,
  ...FiIcons,
  ...HiIcons,
  ...IoIcons,
  ...MdIcons,
  ...RiIcons,
  ...TbIcons,
};

// Filter to get only common/useful icons
const commonIconNames = [
  "AiFillBug", "AiFillCheckCircle", "AiFillClockCircle", "AiFillFlag", "AiFillStar",
  "BiBrain", "BiTask", "BiTime", "BiUser", "BiUsers",
  "BsArrowRight", "BsCheck2Circle", "BsFlag", "BsLightning", "BsPeople",
  "FaFire", "FaFlag", "FaHeart", "FaLightbulb", "FaRocket", "FaStar", "FaThumbsUp",
  "FiActivity", "FiAward", "FiCheck", "FiClock", "FiFlag", "FiStar", "FiTarget", "FiTrendingUp", "FiUser", "FiUsers",
  "HiAcademicCap", "HiBadgeCheck", "HiClock", "HiFlag", "HiStar", "HiTrendingUp",
  "IoCheckmarkCircle", "IoFlag", "IoFlash", "IoHeart", "IoRocket", "IoStar", "IoTime",
  "MdAccessTime", "MdFlag", "MdPeople", "MdPerson", "MdStar", "MdTrendingUp",
  "RiFlag2Fill", "RiLightbulbFill", "RiRocketFill", "RiStarFill", "RiThumbUpFill",
  "TbFlag", "TbFlame", "TbHeart", "TbRocket", "TbStar", "TbTarget"
];

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export const IconPicker = ({ value, onChange }: IconPickerProps) => {
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  const filteredIcons = React.useMemo(() => {
    const iconsToShow = search 
      ? Object.keys(allIcons).filter(name => 
          name.toLowerCase().includes(search.toLowerCase())
        )
      : commonIconNames;
    
    return iconsToShow.slice(0, 100); // Limit to 100 icons for performance
  }, [search]);

  const SelectedIcon = value ? allIcons[value as keyof typeof allIcons] : null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 w-10 p-0">
          {SelectedIcon ? (
            <SelectedIcon className="h-4 w-4" />
          ) : (
            <span className="text-xs">Pick</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 border-b">
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ScrollArea className="h-64">
          <div className="grid grid-cols-8 gap-1 p-2">
            {filteredIcons.map((iconName) => {
              const Icon = allIcons[iconName as keyof typeof allIcons];
              if (!Icon) return null;
              
              return (
                <Button
                  key={iconName}
                  variant={value === iconName ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    onChange(iconName);
                    setIsOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
