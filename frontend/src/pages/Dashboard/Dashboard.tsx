import { useState, useEffect } from 'react';
import Sidebar from '../../components/navigation/sidebar';
import { Box, SimpleGrid, Flex, Text, Heading, Button, Table, Badge, HStack, VStack, Grid } from '@chakra-ui/react';
import { useColorMode } from '../../components/ui/color-mode';
import { useTranslation } from 'react-i18next';
import Icon from '../../components/ui/Icon';

const Dashboard = () => {
  const { colorMode } = useColorMode();
  const { t } = useTranslation();

  const [summaryData, setSummaryData] = useState<null | { revenue?: any; ordersByStatus?: any; stockValue?: number; alerts?: { lowStock: number; outOfStock: number }; recentOrders?: any[] }>(null);
  const [loading, setLoading] = useState(true);

  const cardBg = colorMode === 'light' ? 'white' : 'gray.800';
  const borderColor = colorMode === 'light' ? 'gray.200' : 'gray.700';
  const mainText = colorMode === 'light' ? 'gray.900' : 'white';
  const subText = colorMode === 'light' ? 'gray.500' : 'gray.400';
  const hoverBg = colorMode === 'light' ? 'gray.50' : 'gray.700';
  const headerBg = colorMode === 'light' ? 'gray.50' : 'gray.800';
  const gradientId = "paint0_linear_1131_5935";

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        const response = await fetch('http://localhost:3005/api/v1/dashboard/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setSummaryData(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 0 }).format(value);
  };

  const revenue = summaryData?.revenue?.current || 0;
  const revenueChange = summaryData?.revenue?.change || 0;
  const ordersByStatus = summaryData?.ordersByStatus || {};
  const totalOrders = Object.values(ordersByStatus).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
  const stockValue = summaryData?.stockValue || 0;
  const lowStockCount = summaryData?.alerts?.lowStock || 0;
  const outOfStockCount = summaryData?.alerts?.outOfStock || 0;
  const recentOrders = summaryData?.recentOrders || [];

  const statsCardsData = [
    {
      titleKey: 'dashboard.total_revenue',
      value: formatCurrency(revenue),
      icon: 'payments',
      iconBg: 'green.50',
      iconColor: 'green.600',
      iconBgDark: 'green.900/20',
      iconColorDark: 'green.400',
      trend: revenueChange >= 0 ? 'up' : 'down',
      trendValue: `${Math.abs(revenueChange).toFixed(1)}%`,
      trendColor: revenueChange >= 0 ? 'green.600' : 'red.600',
      trendColorDark: revenueChange >= 0 ? 'green.400' : 'red.400',
      showBorder: true,
      borderColor: revenueChange >= 0 ? 'green.500' : 'red.500'
    },
    {
      titleKey: 'dashboard.orders',
      value: totalOrders.toString(),
      icon: 'shopping_bag',
      iconBg: 'blue.50',
      iconColor: 'blue.500',
      iconBgDark: 'blue.900/20',
      iconColorDark: 'blue.400',
      trend: 'up',
      trendValue: '-',
      trendColor: 'green.600',
      trendColorDark: 'green.400',
      showBorder: true,
      borderColor: 'blue.500'
    },
    {
      titleKey: 'dashboard.stock_value',
      value: formatCurrency(stockValue),
      icon: 'inventory',
      iconBg: 'orange.50',
      iconColor: 'orange.600',
      iconBgDark: 'orange.900/20',
      iconColorDark: 'orange.400',
      trend: 'up',
      trendValue: '-',
      trendColor: 'green.600',
      trendColorDark: 'green.400',
      showBorder: true,
      borderColor: 'orange.500'
    },
    {
      titleKey: 'dashboard.low_stock',
      value: lowStockCount.toString(),
      valueKey: 'dashboard.items',
      icon: 'warning',
      iconBg: 'red.50',
      iconColor: 'red.600',
      iconBgDark: 'red.900/20',
      iconColorDark: 'red.400',
      trend: null,
      customText: 'dashboard.action_required',
      customTextColor: 'red.600',
      customTextColorDark: 'red.400',
      showBorder: true,
      borderColor: 'red.500'
    }
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'LIVREE': return { statusBg: 'green.100', statusColor: 'green.800', statusBgDark: 'green.900/30', statusColorDark: 'green.400', label: t('orders.status.livree') };
      case 'EXPEDIEE': return { statusBg: 'blue.100', statusColor: 'blue.800', statusBgDark: 'blue.900/30', statusColorDark: 'blue.400', label: t('orders.status.expediee') };
      case 'EN_ATTENTE': return { statusBg: 'yellow.100', statusColor: 'yellow.800', statusBgDark: 'yellow.900/30', statusColorDark: 'yellow.400', label: t('orders.status.en_attente') };
      case 'ANNULEE': return { statusBg: 'red.100', statusColor: 'red.800', statusBgDark: 'red.900/30', statusColorDark: 'red.400', label: t('orders.status.annulee') };
      default: return { statusBg: 'gray.100', statusColor: 'gray.800', statusBgDark: 'gray.900/30', statusColorDark: 'gray.400', label: status };
    }
  };

  const stockAlertsData = [];
  if (outOfStockCount > 0) {
    stockAlertsData.push({
      titleKey: 'dashboard.out_of_stock',
      unitsLeft: outOfStockCount,
      icon: 'warning',
      bgColor: 'red.50',
      bgColorDark: 'red.900/10',
      borderColor: 'red.100',
      borderColorDark: 'red.900/20',
      iconBg: 'red.100',
      iconBgDark: 'red.900/30',
      iconColor: 'red.600',
      textColor: 'red.600',
      textColorDark: 'red.400'
    });
  }
  if (lowStockCount > 0) {
    stockAlertsData.push({
      titleKey: 'dashboard.low_stock',
      unitsLeft: lowStockCount,
      icon: 'low_priority',
      bgColor: 'orange.50',
      bgColorDark: 'orange.900/10',
      borderColor: 'orange.100',
      borderColorDark: 'orange.900/20',
      iconBg: 'orange.100',
      iconBgDark: 'orange.900/30',
      iconColor: 'orange.600',
      textColor: 'orange.600',
      textColorDark: 'orange.400'
    });
  }

  return (
    <Sidebar>
      <Box w="full" maxW="1400px" mx="auto" p={8} display="flex" flexDirection="column" gap={6}>
        <Flex justify="space-between" align="center">
          <Box>
            <Text color={subText} fontSize="sm">{t('dashboard.overview')}</Text>
          </Box>
          <HStack gap={2} bg={cardBg} p={1} rounded="lg" border="1px" borderColor={borderColor} shadow="sm" className='list-day'>
            <Button variant="ghost" size="sm" bg="transparent" color={colorMode === 'light' ? 'gray.600' : 'gray.500'} _hover={{ color: "blue.500", bg: colorMode === 'light' ? 'gray.50' : 'whiteAlpha.100' }}>
              {t('dashboard.period.7d')}
            </Button>
            <Button colorPalette="blue" size="sm" variant="solid" bg="blue.50" color="blue.600" _dark={{ bg: "blue.900", color: "blue.200" }}>
              {t('dashboard.period.30d')}
            </Button>
            <Button variant="ghost" size="sm" bg="transparent" color={colorMode === 'light' ? 'gray.600' : 'gray.500'} _hover={{ color: "blue.500", bg: colorMode === 'light' ? 'gray.50' : 'whiteAlpha.100' }}>
              {t('dashboard.period.3m')}
            </Button>
          </HStack>
        </Flex>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
          {statsCardsData.map((card, index) => (
            <Box key={index} bg={cardBg} p={6} rounded="xl" border="1px" borderColor={borderColor} shadow="sm" display="flex" flexDirection="column" justifyContent="space-between" gap={4} {...(card.showBorder && { borderLeft: "4px solid", borderLeftColor: card.borderColor })}>
              <Flex justify="space-between" align="start">
                <Box>
                  <Text color={subText} fontSize="sm" fontWeight="medium" mb={1}>
                    {t(card.titleKey)}
                  </Text>
                  <Heading size="lg" color={mainText}>
                    {card.value} {card.valueKey && t(card.valueKey)}
                  </Heading>
                </Box>
                <Box p={2} rounded="lg" bg={card.iconBg} color={card.iconColor} _dark={{ bg: card.iconBgDark, color: card.iconColorDark }}>
                  <Icon name={card.icon} />
                </Box>
              </Flex>
              <HStack gap={2}>
                {card.trend ? (
                  <>
                    <Flex align="center" color={card.trendColor} _dark={{ color: card.trendColorDark }} fontSize="sm" fontWeight="medium">
                      <Icon name={card.trend === 'up' ? 'trending_up' : 'trending_down'} size={14} />
                      <Text ml={1}>{card.trendValue}</Text>
                    </Flex>
                    <Text color="gray.400" fontSize="sm">
                      {t('dashboard.vs_last_month')}
                    </Text>
                  </>
                ) : (
                  card.customText && (
                    <Text color={card.customTextColor} _dark={{ color: card.customTextColorDark }} fontSize="sm" fontWeight="medium" >
                      {t(card.customText)}
                    </Text>
                  )
                )}
              </HStack>
            </Box>
          ))}
        </SimpleGrid>

        {/* Charts Area */}
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
          <Box bg={cardBg} p={6} rounded="xl" border="1px" borderColor={borderColor} shadow="sm">
            <Flex justify="space-between" align="center" mb={6}>
              <Box>
                <Heading size="md" color={mainText}>{t('dashboard.sales_performance')}</Heading>
                <Text fontSize="sm" color={subText}>{t('dashboard.revenue_vs_previous')}</Text>
              </Box>
              <Button variant="ghost" size="sm" px={0} minW={8} h={8} rounded="lg" bg="transparent" color={colorMode === 'light' ? 'gray.500' : 'gray.400'} _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.200', color: colorMode === 'light' ? 'gray.700' : 'white', }} transition="all 0.2s">
                <Icon name="more_horiz" />
              </Button>
            </Flex>
            <Box position="relative" w="full" h="300px">
              <svg width="100%" height="100%" viewBox="-3 0 478 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={gradientId} x1="236" y1="1" x2="236" y2="149" gradientUnits="userSpaceOnUse">
                    <stop stopColor="currentColor" stopOpacity="0.2" className="text-primary"></stop>
                    <stop offset="1" stopColor="currentColor" stopOpacity="0" className="text-primary"></stop>
                  </linearGradient>
                </defs>
                <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H326.769H0V109Z" fill={`url(#${gradientId})`} style={{ color: "var(--chakra-colors-blue-500)" }}></path>
                <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="currentColor" strokeLinecap="round" strokeWidth="3" style={{ color: "var(--chakra-colors-blue-500)", fill: 'none' }}></path>
              </svg>
            </Box>
            <Flex justify="space-between" mt={4} px={2}>
              {['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul'].map(month => (
                <Text key={month} fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase" letterSpacing="wider">{t(`dashboard.months.${month}`)}</Text>
              ))}
            </Flex>
          </Box>

          {/* Categories Chart */}
          <Box bg={cardBg} p={6} rounded="xl" border="1px" borderColor={borderColor} shadow="sm" display="flex" flexDirection="column">
            <Heading size="md" color={mainText} mb={2}>{t('dashboard.stock_distribution')}</Heading>
            <Text fontSize="sm" color={subText} mb={6}>{t('dashboard.by_category')}</Text>
            <VStack gap={6} flex={1} justify="center" align="stretch">
              <Box>
                <Flex justify="space-between" align="center" mb={1}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.600" _dark={{ color: "gray.300" }}>{t('dashboard.electronics')}</Text>
                  <Text fontSize="sm" fontWeight="bold" color={mainText}>60%</Text>
                </Flex>
                <Box w="full" h={2} bg="gray.100" _dark={{ bg: "gray.700" }} rounded="full" overflow="hidden">
                  <Box h="full" bg="blue.500" w="60%" rounded="full" />
                </Box>
              </Box>
              <Box>
                <Flex justify="space-between" align="center" mb={1}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.600" _dark={{ color: "gray.300" }}>{t('dashboard.home')}</Text>
                  <Text fontSize="sm" fontWeight="bold" color={mainText}>20%</Text>
                </Flex>
                <Box w="full" h={2} bg="gray.100" _dark={{ bg: "gray.700" }} rounded="full" overflow="hidden">
                  <Box h="full" bg="teal.500" w="20%" rounded="full" />
                </Box>
              </Box>
              <Box>
                <Flex justify="space-between" align="center" mb={1}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.600" _dark={{ color: "gray.300" }}>{t('dashboard.sports')}</Text>
                  <Text fontSize="sm" fontWeight="bold" color={mainText}>15%</Text>
                </Flex>
                <Box w="full" h={2} bg="gray.100" _dark={{ bg: "gray.700" }} rounded="full" overflow="hidden">
                  <Box h="full" bg="orange.500" w="15%" rounded="full" />
                </Box>
              </Box>
              <Box>
                <Flex justify="space-between" align="center" mb={1}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.600" _dark={{ color: "gray.300" }}>{t('dashboard.other')}</Text>
                  <Text fontSize="sm" fontWeight="bold" color={mainText}>5%</Text>
                </Flex>
                <Box w="full" h={2} bg="gray.100" _dark={{ bg: "gray.700" }} rounded="full" overflow="hidden">
                  <Box h="full" bg="gray.400" w="5%" rounded="full" />
                </Box>
              </Box>
            </VStack>
          </Box>
        </Grid>

        {/* Recent Activity & Quick Actions Grid */}
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6} pb={6}>
          <Box bg={cardBg} rounded="xl" border="1px" borderColor={borderColor} shadow="sm" overflow="hidden">
            <Flex p={6} borderBottom="1px" borderColor={borderColor} justify="space-between" align="center">
              <Heading size="md" color={mainText}>{t('dashboard.recent_orders')}</Heading>
              <Button variant="ghost" size="sm" bg="transparent" color={colorMode === 'light' ? 'blue.600' : 'blue.300'} _hover={{ bg: colorMode === 'light' ? 'blue.50' : 'blue.900/30', color: colorMode === 'light' ? 'blue.700' : 'blue.200', }} transition="all 0.2s">
                {t('dashboard.view_all')}
              </Button>
            </Flex>
            <Box overflowX="auto">
              <Table.Root variant="outline" size="sm">
                <Table.Header bg={headerBg}>
                  <Table.Row>
                    <Table.ColumnHeader color="gray.500" textTransform="uppercase" fontSize="xs" fontWeight="bold" letterSpacing="wider" py={4} px={6}>{t('dashboard.id')}</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.500" textTransform="uppercase" fontSize="xs" fontWeight="bold" letterSpacing="wider" py={4} px={6}>{t('dashboard.product')}</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.500" textTransform="uppercase" fontSize="xs" fontWeight="bold" letterSpacing="wider" py={4} px={6}>{t('dashboard.customer')}</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.500" textTransform="uppercase" fontSize="xs" fontWeight="bold" letterSpacing="wider" py={4} px={6}>{t('dashboard.status')}</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.500" textTransform="uppercase" fontSize="xs" fontWeight="bold" letterSpacing="wider" py={4} px={6} textAlign="right">{t('dashboard.amount')}</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {recentOrders.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={5} textAlign="center" py={8} color="gray.500">
                        {t('common.no_results')}
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    recentOrders.slice(0, 5).map((order: any, index: number) => {
                      const style = getStatusStyle(order.status);
                      return (
                        <Table.Row key={order.id || index} _hover={{ bg: hoverBg }}>
                          <Table.Cell px={6} py={4} fontWeight="medium" color={mainText} fontFamily="mono" fontSize="sm">
                            #{order.id?.slice(0, 8) || '-'}
                          </Table.Cell>
                          <Table.Cell px={6} py={4} color="gray.600" _dark={{ color: "gray.300" }}>
                            -
                          </Table.Cell>
                          <Table.Cell px={6} py={4} color="gray.600" _dark={{ color: "gray.300" }}>
                            {order.customer || '-'}
                          </Table.Cell>
                          <Table.Cell px={6} py={4}>
                            <Badge bg={style.statusBg} color={style.statusColor} _dark={{ bg: style.statusBgDark, color: style.statusColorDark }} px={2.5} py={0.5} rounded="full" textTransform="none">
                              {style.label}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell px={6} py={4} textAlign="right" fontWeight="medium" color={mainText}>
                            {formatCurrency(Number(order.totalAmount) || 0)}
                          </Table.Cell>
                        </Table.Row>
                      );
                    })
                  )}
                </Table.Body>
              </Table.Root>
            </Box>
          </Box>

          {/* Stock Alerts Widget */}
          <Box bg={cardBg} rounded="xl" border="1px" borderColor={borderColor} shadow="sm" display="flex" flexDirection="column">
            <Box p={6} borderBottom="1px" borderColor={borderColor}>
              <Heading size="md" color={mainText}>{t('dashboard.stock_alerts')}</Heading>
            </Box>
            <VStack gap={4} p={6} align="stretch">
              {stockAlertsData.map((alert, index) => (
                <Flex key={index} align="center" gap={4} p={3} bg={alert.bgColor} _dark={{ bg: alert.bgColorDark, borderColor: alert.borderColorDark }} rounded="lg" border="1px" borderColor={alert.borderColor}>
                  <Box bg={alert.iconBg} _dark={{ bg: alert.iconBgDark }} p={2} rounded="full" color={alert.iconColor}>
                    <Icon name={alert.icon} size={20} />
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="bold" color={mainText}>
                      {t(alert.titleKey)}
                    </Text>
                    <Text fontSize="xs" color={alert.textColor} _dark={{ color: alert.textColorDark }} fontWeight="medium">
                      Reste {alert.unitsLeft} {t('dashboard.units_left')}
                    </Text>
                  </Box>
                  <Button size="xs" bg={cardBg} border="1px" borderColor={borderColor} color={colorMode === 'dark' ? 'whiteAlpha.500' : 'gray.700'} _hover={{ bg: colorMode === 'light' ? 'gray.50' : 'whiteAlpha.100', color: colorMode === 'dark' ? 'whiteAlpha.800' : 'gray.900' }} transition="all 0.2s">
                    {t('dashboard.order')}
                  </Button>
                </Flex>
              ))}
              <Button mt={2} variant="outline" borderStyle="dashed" borderWidth="2px" borderColor={colorMode === 'light' ? 'gray.600' : 'gray.600'} bg={colorMode === 'light' ? 'whiteAlpha.100' : 'transparent'} color={colorMode === 'light' ? 'gray.600' : 'gray.500'} _hover={{ color: "blue.500", borderColor: "blue.500", bg: colorMode === 'light' ? "blue.50" : "whiteAlpha.100" }} h="auto" py={2.5}>
                <HStack gap={2}>
                  <Icon name="add" size={18} />
                  <Text fontSize="sm" fontWeight="medium">{t('dashboard.add_alert')}</Text>
                </HStack>
              </Button>
            </VStack>
          </Box>
        </Grid>
      </Box>
    </Sidebar>
  );
};

export default Dashboard;