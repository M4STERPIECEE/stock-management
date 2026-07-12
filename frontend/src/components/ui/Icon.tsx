import { HugeiconsIcon } from '@hugeicons/react';
import {
    AddIcon,
    AnalyticsIcon,
    ArrowDown01Icon,
    ArrowLeft01Icon,
    ArrowRight01Icon,
    BarChartIcon,
    BellIcon,
    Camera01Icon,
    Cancel01Icon,
    ChartDecreaseIcon,
    ChartIncreaseIcon,
    CheckIcon,
    CheckmarkCircle01Icon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DangerIcon,
    Delete01Icon,
    DollarIcon,
    Edit01Icon,
    EyeIcon,
    EyeOffIcon,
    FilterIcon,
    GridViewIcon,
    HamburgerIcon,
    LayoutIcon,
    LockIcon,
    Logout01Icon,
    Mail01Icon,
    MailOpenIcon,
    More01Icon,
    Package01Icon,
    RemoveIcon,
    SearchIcon,
    Settings01Icon,
    ShoppingBagIcon,
    ShoppingCartIcon,
    ShoppingCartRemove01Icon,
    Tag01Icon,
    User02Icon,
    UserGroupIcon,
    UserIcon,
    UserMinus01Icon,
    WarehouseIcon,
} from '@hugeicons/core-free-icons';

type IconSvgElement = import('@hugeicons/react').IconSvgElement;

const iconMap: Record<string, IconSvgElement> = {
    account_circle: UserIcon,
    add: AddIcon,
    arrow_back: ArrowLeft01Icon,
    bar_chart: BarChartIcon,
    check_circle: CheckmarkCircle01Icon,
    chevron_left: ChevronLeftIcon,
    chevron_right: ChevronRightIcon,
    close: Cancel01Icon,
    dashboard: LayoutIcon,
    delete: Delete01Icon,
    edit: Edit01Icon,
    error: DangerIcon,
    expand_more: ChevronDownIcon,
    filter_list: FilterIcon,
    format_list_bulleted: GridViewIcon,
    grid_view: GridViewIcon,
    group: UserGroupIcon,
    inventory: WarehouseIcon,
    group_off: UserMinus01Icon,
    inventory_2: Package01Icon,
    keyboard_arrow_down: ArrowDown01Icon,
    lock: LockIcon,
    logout: Logout01Icon,
    low_priority: ArrowDown01Icon,
    mail: Mail01Icon,
    mark_email_read: MailOpenIcon,
    menu: HamburgerIcon,
    more_horiz: More01Icon,
    package_2: Package01Icon,
    payments: DollarIcon,
    person: User02Icon,
    photo_camera: Camera01Icon,
    remove: RemoveIcon,
    search: SearchIcon,
    sell: Tag01Icon,
    settings: Settings01Icon,
    shopping_bag: ShoppingBagIcon,
    shopping_cart: ShoppingCartIcon,
    shopping_cart_off: ShoppingCartRemove01Icon,
    trending_up: ChartIncreaseIcon,
    trending_down: ChartDecreaseIcon,
    verified_user: CheckmarkCircle01Icon,
    visibility: EyeIcon,
    visibility_off: EyeOffIcon,
    warning: DangerIcon,
    check: CheckIcon,
    radio_button_unchecked: Cancel01Icon,
    analysis: AnalyticsIcon,
    notification: BellIcon,
    light_bulb: Camera01Icon,
};

interface IconProps {
    name: string;
    size?: number;
    color?: string;
    className?: string;
}

const Icon = ({ name, size = 20, color = 'currentColor', className }: IconProps) => {
    const hugeIcon = iconMap[name];
    if (!hugeIcon) return null;
    return (
        <HugeiconsIcon icon={hugeIcon} size={size} color={color} strokeWidth={1.5} className={className} />
    );
};

export default Icon;
