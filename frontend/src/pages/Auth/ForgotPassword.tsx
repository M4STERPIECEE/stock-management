import React, { useState } from 'react';
import { Box, Flex, Text, Button, Input, Stack, Link, InputGroup } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppToast } from '../../hooks/useAppToast';
import Icon from '../../components/ui/Icon';

const INK = '#151A21';
const PAPER = '#EFF1EC';
const AMBER = '#E8A33D';
const SAGE = '#4F7C6B';
const SAGE_DARK = '#3C6053';

const TEXT_MAIN = INK;
const TEXT_SUB = '#5B6675';
const INPUT_BORDER = '#D7DBE1';

const ForgotPasswordFormContent = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { showToast } = useAppToast();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';
            const response = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                showToast({ title: t('auth.forgot.success') });
                setTimeout(() => {
                    navigate('/link-verification');
                }, 1000);
            } else {
                showToast({ title: t('auth.forgot.error_generic'), status: 'error' });
            }
        } catch {
            showToast({ title: t('login.error_network'), status: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <style>{`
                @keyframes stockmgr-color-shift {
                    0% { transform: scale(1); opacity: 0.35; }
                    50% { transform: scale(1.2); opacity: 0.6; }
                    100% { transform: scale(1); opacity: 0.35; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .stockmgr-color-layer {
                        animation: none !important;
                    }
                }
            `}</style>

            <Flex minH="100vh" bg={PAPER}>
                <Flex display={{ base: 'none', lg: 'flex' }} direction="column" justify="center" w="42%" minW="420px" bg={INK} color="whiteAlpha.900" p="10" pos="relative" overflow="hidden">
                    <Box pos="absolute" inset="0" bg={INK} />
                    <Box className="stockmgr-color-layer" pos="absolute" inset="0" opacity="0.35" backgroundImage={`linear-gradient(135deg, ${AMBER}, ${SAGE_DARK}, ${SAGE}, ${INK}, ${AMBER})`} backgroundSize="200% 200%" style={{ animation: 'stockmgr-color-shift 8s ease-in-out infinite' }} />
                    <Box pos="absolute" inset="0" bgGradient={`linear(to-b, ${INK} 0%, transparent 25%, transparent 75%, ${INK} 100%)`} />

                    <Flex align="center" gap="3" zIndex="1" position="absolute" top="10">
                        <Flex align="center" justify="center" w="9" h="9" borderRadius="md" bg={AMBER} color={INK}>
                            <Icon name="inventory_2" size={20} />
                        </Flex>
                        <Text fontSize="md" fontWeight="bold" letterSpacing="tight">StockManager</Text>
                    </Flex>

                    <Box zIndex="1" maxW="360px" textAlign="center" margin="0 auto">
                        <Text fontSize="4xl" fontWeight="800" lineHeight="1.1" letterSpacing="-0.02em" mb="4">
                            {t('login.forgot_password')}
                        </Text>
                        <Text color="whiteAlpha.600" fontSize="sm" lineHeight="1.6">
                            {t('auth.forgot.hero_subtitle', "Pas de panique. Saisissez l'adresse e-mail associée à votre compte administrateur ci-dessous.")}
                        </Text>
                    </Box>
                </Flex>

                <Flex flex="1" align="center" justify="center" p={{ base: 6, md: 10 }}>
                    <Box w="full" maxW="380px" bg="white" borderRadius="xl" p={{ base: 6, md: 8 }} boxShadow="lg">
                        <Flex display={{ base: 'flex', lg: 'none' }} align="center" gap="3" mb="6">
                            <Flex align="center" justify="center" w="9" h="9" borderRadius="md" bg={INK} color={AMBER}>
                                <Icon name="inventory_2" size={20} />
                            </Flex>
                            <Text fontSize="md" fontWeight="bold" letterSpacing="tight" color={TEXT_MAIN}>StockManager</Text>
                        </Flex>

                        <Text fontFamily="mono" fontSize="xs" letterSpacing="0.15em" color={AMBER} fontWeight="bold" mb="3">
                            {t('auth.forgot.kicker')}
                        </Text>
                        <Text fontSize="2xl" fontWeight="800" letterSpacing="-0.02em" color={TEXT_MAIN} mb="2">
                            {t('login.forgot_password')}
                        </Text>
                        <Text color={TEXT_SUB} fontSize="sm" mb="8">
                            {t('auth.forgot.card_subtitle', 'Saisissez votre email pour recevoir un lien de réinitialisation.')}
                        </Text>

                        <form onSubmit={handleSubmit}>
                            <Stack gap="5">
                                <Box>
                                    <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.03em" mb="2" color={TEXT_SUB} textTransform="uppercase">
                                        {t('auth.forgot.email_label')}
                                    </Text>
                                    <InputGroup w="full" startElement={<Icon name="mail" size={18} color="#7A8494" />}>
                                        <Input value={email} onChange={(e) => setEmail(e.target.value)} name="email" type="email" autoComplete="email" placeholder="adresse.email@example.com" size="lg" bg="white" color={TEXT_MAIN} border="1px solid" borderColor={INPUT_BORDER} borderRadius="md" h="11" fontSize="sm" _placeholder={{ color: '#9AA3AF' }} _focus={{ borderColor: SAGE, boxShadow: `0 0 0 1px ${SAGE}` }} />
                                    </InputGroup>
                                </Box>

                                <Button w="full" h="12" bg={SAGE} color="white" fontSize="sm" fontWeight="bold" letterSpacing="0.02em" borderRadius="md" _hover={{ bg: SAGE_DARK }} _active={{ transform: 'scale(0.98)' }} type="submit" disabled={isSubmitting} loading={isSubmitting}>
                                    {t('auth.forgot.submit')}
                                </Button>
                            </Stack>
                        </form>

                        <Flex align="center" gap="3" mt="6">
                            <Box flex="1" h="1px" bg={INPUT_BORDER} />
                            <Text fontSize="xs" color={TEXT_SUB}>{t('auth.forgot.or')}</Text>
                            <Box flex="1" h="1px" bg={INPUT_BORDER} />
                        </Flex>

                        <Link fontSize="sm" fontWeight="semibold" color={SAGE_DARK} _hover={{ color: AMBER }} onClick={() => navigate('/login')} display="flex" alignItems="center" justifyContent="center" gap="1" mt="4">
                            <Icon name="arrow_back" size={16} />
                            {t('auth.forgot.back_to_login')}
                        </Link>

                        <Text fontSize="xs" color={TEXT_SUB} textAlign="center" mt="8">
                            © {new Date().getFullYear()} StockManager
                        </Text>
                    </Box>
                </Flex>
            </Flex>
        </>
    );
};

export default ForgotPasswordFormContent;
