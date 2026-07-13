import { AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpDown, BadgeCheck, BarChart, BarChart3, Bell, Camera, Check, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Circle, DollarSign, Eye, EyeOff, FileUp, Filter, Flag, Globe, Languages, Lightbulb, List, LayoutDashboard, LayoutGrid, Lock, LogOut, Mail, MailCheck, Menu, Minus, MoreHorizontal, Package, Pencil, Plus, Search, Settings, ShoppingBag, ShoppingCart, Tag, Trash2, TrendingDown, TrendingUp, Upload, User, UserCircle, UserMinus, Users, Warehouse, X, XCircle, type LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
    account_circle: User,
    add: Plus,
    analysis: BarChart,
    arrow_back: ArrowLeft,
    arrow_downward: ArrowDown,
    arrow_upward: ArrowUp,
    bar_chart: BarChart3,
    check: Check,
    check_circle: CheckCircle,
    chevron_left: ChevronLeft,
    chevron_right: ChevronRight,
    close: X,
    dashboard: LayoutDashboard,
    delete: Trash2,
    edit: Pencil,
    error: AlertTriangle,
    expand_more: ChevronDown,
    filter_list: Filter,
    flag: Flag,
    format_list_bulleted: List,
    grid_view: LayoutGrid,
    group: Users,
    group_off: UserMinus,
    inventory: Warehouse,
    inventory_2: Package,
    keyboard_arrow_down: ChevronDown,
    language: Globe,
    light_bulb: Lightbulb,
    lock: Lock,
    logout: LogOut,
    low_priority: ArrowDown,
    mail: Mail,
    mark_email_read: MailCheck,
    menu: Menu,
    more_horiz: MoreHorizontal,
    notification: Bell,
    package_2: Package,
    payments: DollarSign,
    person: UserCircle,
    photo_camera: Camera,
    radio_button_unchecked: Circle,
    remove: Minus,
    search: Search,
    sell: Tag,
    settings: Settings,
    shopping_bag: ShoppingBag,
    shopping_cart: ShoppingCart,
    shopping_cart_off: XCircle,
    swap_vert: ArrowUpDown,
    trending_down: TrendingDown,
    trending_up: TrendingUp,
    translate: Languages,
    upload: Upload,
    upload_file: FileUp,
    verified_user: BadgeCheck,
    visibility: Eye,
    visibility_off: EyeOff,
    warning: AlertTriangle,
};

interface IconProps {
    name: string;
    size?: number;
    color?: string;
    className?: string;
}

const Icon = ({ name, size = 20, color = 'currentColor', className }: IconProps) => {
    const LucideIcon = iconMap[name];
    if (!LucideIcon) return null;
    return <LucideIcon size={size} color={color} strokeWidth={1.5} className={className} />;
};

export default Icon;