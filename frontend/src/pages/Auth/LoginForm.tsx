import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Button, Input, Stack, Checkbox, Link, Container, IconButton, InputGroup } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { useTranslation } from 'react-i18next';

const INK = '#151A21';
const INK_SOFT = '#1E252F';
const PAPER = '#EFF1EC';
const PAPER_DARK = '#0F1318';
const AMBER = '#E8A33D';
const SAGE = '#4F7C6B';
const SAGE_DARK = '#3C6053';
const TEXT_MAIN = INK;
const TEXT_SUB = '#5B6675';
const INPUT_BORDER = '#D7DBE1';

const SnackbarContent = ({ message, isError = false }: { message: string, isError?: boolean }) => {
    return (
        <Box position="fixed" bottom={8} left="50%" transform="translateX(-50%)" bg={isError ? '#B3431F' : SAGE} color="white" px={6} py={3} borderRadius="md" boxShadow="xl" display="flex" alignItems="center" gap={3} zIndex={9999} animation="stockmgr-fade-in 0.25s ease-out">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                {isError ? 'error' : 'check_circle'}
            </span>
            <Text fontSize="sm" fontWeight="medium">{message}</Text>
        </Box>
    );
};

const stockTags = [
    { code: 'SKU-2291', label: '84 en stock', top: '18%', left: '8%' },
    { code: 'SKU-1187', label: 'Rupture', top: '58%', left: '62%' },
    { code: 'SKU-3340', label: '212 en stock', top: '76%', left: '14%' },
];

const LoginFormContent = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => setErrorMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setIsSubmitting(true);
        try {
            const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';
            const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setErrorMessage(t('login.error_incorrect'));
                } else {
                    setErrorMessage(t('login.error_generic'));
                }
                setIsSubmitting(false);
                return;
            }

            const data: { access_token?: string } = await response.json();
            if (!data?.access_token) {
                setErrorMessage(t('login.error_invalid_response'));
                setIsSubmitting(false);
                return;
            }

            const storage = rememberMe ? window.localStorage : window.sessionStorage;
            storage.setItem('access_token', data.access_token);
            setErrorMessage(null);
            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 500);
        } catch {
            setErrorMessage(t('login.error_network'));
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <style>{`
                @keyframes stockmgr-fade-in {
                    from { opacity: 0; transform: translate(-50%, 8px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                @keyframes stockmgr-scan {
                    0% { left: -20%; }
                    100% { left: 100%; }
                }
                @keyframes stockmgr-drift {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                @keyframes stockmgr-color-shift {
                    0% { transform: scale(1); opacity: 0.35; }
                    50% { transform: scale(1.2); opacity: 0.6; }
                    100% { transform: scale(1); opacity: 0.35; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .stockmgr-scan-line, .stockmgr-tag, .stockmgr-color-layer {
                        animation: none !important;
                    }
                }
            `}</style>

            <Flex minH="100vh" bg={PAPER}>
                <Flex display={{ base: 'none', lg: 'flex' }} direction="column" justify="center" w="42%" minW="420px" bg={INK} color="whiteAlpha.900" p="10" pos="relative" overflow="hidden">
                    <Box pos="absolute" inset="0" bg={INK} />
                    <Box pos="absolute" inset="0" opacity="0.35" backgroundImage={`linear-gradient(135deg, ${AMBER}, ${SAGE_DARK}, ${SAGE}, ${INK}, ${AMBER})`} backgroundSize="200% 200%" style={{ animation: 'stockmgr-color-shift 8s ease-in-out infinite' }} />
                    <Box pos="absolute" inset="0" bgGradient={`linear(to-b, ${INK} 0%, transparent 25%, transparent 75%, ${INK} 100%)`} />
                    {stockTags.map((tag) => (
                        <Box key={tag.code} className="stockmgr-tag" pos="absolute" top={tag.top} left={tag.left} bg={INK_SOFT} border="1px solid" borderColor="whiteAlpha.200" borderRadius="md" px="3" py="2" fontFamily="mono" fontSize="xs" boxShadow="0 8px 24px rgba(0,0,0,0.35)" zIndex="1" style={{ animation: 'stockmgr-drift 6s ease-in-out infinite' }}>
                            <Text color={AMBER} fontWeight="bold" letterSpacing="0.05em">{tag.code}</Text>
                            <Text color="whiteAlpha.700">{tag.label}</Text>
                        </Box>
                    ))}

                    <Flex align="center" gap="3" zIndex="1" position="absolute" top="10">
                        <Flex align="center" justify="center" w="9" h="9" borderRadius="md" bg={AMBER} color={INK}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>inventory_2</span>
                        </Flex>
                        <Text fontSize="md" fontWeight="bold" letterSpacing="tight">StockManager</Text>
                    </Flex>

                    <Box zIndex="1" maxW="360px" textAlign="center" margin="0 auto">
                        <Text fontSize="4xl" fontWeight="800" lineHeight="1.1" letterSpacing="-0.02em" mb="4">
                            {t('login.hero_title', 'Chaque référence, à sa juste place.')}
                        </Text>
                        <Text color="whiteAlpha.600" fontSize="sm" lineHeight="1.6">
                            {t('login.hero_subtitle', 'Suivez vos stocks, vos ventes et vos équipes depuis un seul endroit.')}
                        </Text>
                    </Box>
                </Flex>
                <Flex flex="1" align="center" justify="center" p={{ base: 6, md: 10 }}>
                    <Box w="full" maxW="380px" bg="white" borderRadius="xl" p={{ base: 6, md: 8 }} boxShadow="lg">
                        <Flex display={{ base: 'flex', lg: 'none' }} align="center" gap="3" mb="6">
                            <Flex align="center" justify="center" w="9" h="9" borderRadius="md" bg={INK} color={AMBER}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>inventory_2</span>
                            </Flex>
                            <Text fontSize="md" fontWeight="bold" letterSpacing="tight" color={TEXT_MAIN}>StockManager</Text>
                        </Flex>
                        <Text fontFamily="mono" fontSize="xs" letterSpacing="0.15em" color={AMBER} fontWeight="bold" mb="3">
                            {t('login.kicker', 'CONNEXION')}
                        </Text>
                        <Text fontSize="2xl" fontWeight="800" letterSpacing="-0.02em" color={TEXT_MAIN} mb="2">
                            {t('login.title')}
                        </Text>
                        <Text color={TEXT_SUB} fontSize="sm" mb="8">
                            {t('login.subtitle')}
                        </Text>
                        <form onSubmit={handleSubmit}>
                            <Stack gap="5">
                                <Box>
                                    <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.03em" mb="2" color={TEXT_SUB} textTransform="uppercase">
                                        {t('login.email_label')}
                                    </Text>
                                    <InputGroup w="full" startElement={<span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7A8494' }}>person</span>}>
                                        <Input value={email} onChange={(e) => setEmail(e.target.value)} name="email" type="email" autoComplete="email" placeholder="adresse.email@example.com" size="lg" bg="white" color={TEXT_MAIN} border="1px solid" borderColor={INPUT_BORDER} borderRadius="md" h="11" fontSize="sm" _placeholder={{ color: '#9AA3AF' }} _focus={{ borderColor: SAGE, boxShadow: `0 0 0 1px ${SAGE}` }} />
                                    </InputGroup>
                                </Box>
                                <Box>
                                    <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.03em" mb="2" color={TEXT_SUB} textTransform="uppercase">
                                        {t('login.password_label')}
                                    </Text>
                                    <InputGroup w="full" startElement={<span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7A8494' }}>lock</span>} endElement={<IconButton variant="ghost" aria-label="Toggle password" onClick={() => setShowPassword(!showPassword)} size="sm" bg="transparent" color={TEXT_SUB} _hover={{ bg: 'transparent', color: INK }} _active={{ bg: 'transparent' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{showPassword ? 'visibility_off' : 'visibility'}</span></IconButton>}>
                                        <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} name="password" autoComplete="current-password" placeholder="••••••••" size="lg" bg="white" color={TEXT_MAIN} border="1px solid" borderColor={INPUT_BORDER} borderRadius="md" h="11" fontSize="sm" _placeholder={{ color: '#9AA3AF' }} _focus={{ borderColor: SAGE, boxShadow: `0 0 0 1px ${SAGE}` }} />
                                    </InputGroup>
                                </Box>
                                <Flex align="center" justify="space-between">
                                    <Checkbox.Root variant="subtle" checked={rememberMe} onCheckedChange={(details) => setRememberMe(Boolean(details.checked))}>
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control border="1px solid" borderColor="gray.300" _checked={{ bg: SAGE, borderColor: SAGE, color: 'white' }} borderRadius="sm" />
                                        <Checkbox.Label fontSize="sm" color={TEXT_SUB}>
                                            {t('login.remember_me')}
                                        </Checkbox.Label>
                                    </Checkbox.Root>
                                    <Link fontSize="sm" fontWeight="semibold" color={SAGE_DARK} _hover={{ color: AMBER }} onClick={() => navigate('/forgot-password')}>
                                        {t('login.forgot_password')}
                                    </Link>
                                </Flex>
                                <Button w="full" h="12" bg={SAGE} color="white" fontSize="sm" fontWeight="bold" letterSpacing="0.02em" borderRadius="md" pos="relative" overflow="hidden" _hover={{ bg: SAGE_DARK }} _active={{ transform: 'scale(0.98)' }} type="submit" disabled={isSubmitting} loading={isSubmitting}>
                                    {t('login.submit')}
                                    {isSubmitting && (
                                        <Box className="stockmgr-scan-line" pos="absolute" top="0" bottom="0" w="30%" bgGradient={`linear(to-r, transparent, ${AMBER}, transparent)`} style={{ animation: 'stockmgr-scan 1.1s linear infinite' }} />
                                    )}
                                </Button>
                                {errorMessage && <SnackbarContent message={errorMessage} isError />}
                            </Stack>
                        </form>
                        <Text fontSize="xs" color={TEXT_SUB} textAlign="center" mt="8">
                            {t('login.protected_text')}
                        </Text>
                    </Box>
                </Flex>
            </Flex>
        </>
    );
};

const LoginForm = () => {
    return (
        <PageTransition>
            <LoginFormContent />
        </PageTransition>
    );
};

export default LoginForm;