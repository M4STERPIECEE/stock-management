import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Flex, Text, Button, Input, Stack, Link, IconButton, Grid, GridItem } from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const ResetPassword = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { showToast } = useAppToast();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isTokenMissing = !token;

    const RequirementItem = ({ met, label }: { met: boolean, label: string }) => (
        <Flex align="center" gap="2" color={met ? SAGE : TEXT_SUB}>
        <Icon name={met ? 'check_circle' : 'radio_button_unchecked'} size={18} />
            <Text fontSize="sm" fontWeight="medium">{label}</Text>
        </Flex>
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast({ title: t('auth.reset.error_password_mismatch'), status: 'error' });
            return;
        }

        if (!hasMinLength || !hasUpperCase || !hasNumber || !hasSpecialChar) {
            showToast({ title: t('auth.reset.error_criteria'), status: 'error' });
            return;
        }

        if (!token) {
            showToast({ title: t('auth.reset.error_token_missing'), status: 'error' });
            return;
        }

        setIsSubmitting(true);

        try {
            const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';
            const response = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, newPassword: password }),
            });

            if (response.ok) {
                showToast({ title: t('auth.reset.success'), status: 'success' });
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                const data = await response.json();
                showToast({ title: data.message || t('auth.reset.error_generic'), status: 'error' });
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
                            {t('auth.reset.hero_title', 'Réinitialisation du mot de passe')}
                        </Text>
                        <Text color="whiteAlpha.600" fontSize="sm" lineHeight="1.6">
                            {t('auth.reset.hero_subtitle', 'Choisissez un nouveau mot de passe sécurisé pour votre compte administrateur.')}
                        </Text>
                    </Box>
                </Flex>

                <Flex flex="1" align="center" justify="center" p={{ base: 6, md: 10 }}>
                    <Box w="full" maxW="420px" bg="white" borderRadius="xl" p={{ base: 6, md: 8 }} boxShadow="lg">
                        <Flex display={{ base: 'flex', lg: 'none' }} align="center" gap="3" mb="6">
                            <Flex align="center" justify="center" w="9" h="9" borderRadius="md" bg={INK} color={AMBER}>
                                <Icon name="inventory_2" size={20} />
                            </Flex>
                            <Text fontSize="md" fontWeight="bold" letterSpacing="tight" color={TEXT_MAIN}>StockManager</Text>
                        </Flex>

                        <Text fontFamily="mono" fontSize="xs" letterSpacing="0.15em" color={AMBER} fontWeight="bold" mb="3">
                            {t('auth.reset.kicker')}
                        </Text>
                        <Text fontSize="2xl" fontWeight="800" letterSpacing="-0.02em" color={TEXT_MAIN} mb="2">
                            {t('auth.reset.title')}
                        </Text>
                        <Text color={TEXT_SUB} fontSize="sm" mb="6">
                            {t('auth.reset.subtitle')}
                        </Text>

                        {isTokenMissing && (
                            <Box mb="4" p="3" bg="#B3431F" color="white" borderRadius="md" display="flex" alignItems="center" gap="2" fontSize="sm">
                                <Icon name="error" size={20} />
                                <Text fontWeight="medium">{t('auth.reset.token_missing')}</Text>
                            </Box>
                        )}

                        <form onSubmit={handleSubmit}>
                            <Stack gap="5">
                                <Box>
                                    <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.03em" mb="2" color={TEXT_SUB} textTransform="uppercase">
                                        {t('auth.reset.new_password_label')}
                                    </Text>
                                    <Box position="relative">
                                        <Input disabled={isTokenMissing} css={{ "&::-ms-reveal, &::-ms-clear": { display: "none" } }} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" size="lg" bg="white" color={TEXT_MAIN} border="1px solid" borderColor={INPUT_BORDER} borderRadius="md" h="11" fontSize="sm" pr="12" _placeholder={{ color: '#9AA3AF' }} _focus={{ borderColor: SAGE, boxShadow: `0 0 0 1px ${SAGE}` }} />
                                        <IconButton disabled={isTokenMissing} aria-label="Toggle password visibility" variant="ghost" position="absolute" right="0" top="0" bottom="0" h="full" px="3" color={TEXT_SUB} bg="transparent" _hover={{ bg: "transparent", color: INK }} _active={{ bg: "transparent" }} onClick={() => setShowPassword(!showPassword)}>
                                            <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                                        </IconButton>
                                    </Box>
                                </Box>

                                {password.length > 0 && (
                                    <Box bg={PAPER} borderRadius="md" p="4" border="1px solid" borderColor={INPUT_BORDER}>
                                        <Text fontSize="xs" fontWeight="semibold" color={TEXT_SUB} textTransform="uppercase" letterSpacing="wider" mb="3">
                                            {t('auth.reset.criteria_title')}
                                        </Text>
                                        <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="3">
                                            <GridItem><RequirementItem met={hasMinLength} label={t('auth.reset.criteria_min_length')} /></GridItem>
                                            <GridItem><RequirementItem met={hasUpperCase} label={t('auth.reset.criteria_uppercase')} /></GridItem>
                                            <GridItem><RequirementItem met={hasNumber} label={t('auth.reset.criteria_number')} /></GridItem>
                                            <GridItem><RequirementItem met={hasSpecialChar} label={t('auth.reset.criteria_special')} /></GridItem>
                                        </Grid>
                                    </Box>
                                )}

                                <Box>
                                    <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.03em" mb="2" color={TEXT_SUB} textTransform="uppercase">
                                        {t('auth.reset.confirm_password_label')}
                                    </Text>
                                    <Box position="relative">
                                        <Input disabled={isTokenMissing} css={{ "&::-ms-reveal, &::-ms-clear": { display: "none" } }} type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" size="lg" bg="white" color={TEXT_MAIN} border="1px solid" borderColor={INPUT_BORDER} borderRadius="md" h="11" fontSize="sm" pr="12" _placeholder={{ color: '#9AA3AF' }} _focus={{ borderColor: SAGE, boxShadow: `0 0 0 1px ${SAGE}` }} />
                                        <IconButton disabled={isTokenMissing} aria-label="Toggle password visibility" variant="ghost" position="absolute" right="0" top="0" bottom="0" h="full" px="3" color={TEXT_SUB} bg="transparent" _hover={{ bg: "transparent", color: INK }} _active={{ bg: "transparent" }} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                            <Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} size={18} />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Button w="full" h="12" bg={SAGE} color="white" fontSize="sm" fontWeight="bold" letterSpacing="0.02em" borderRadius="md" _hover={{ bg: SAGE_DARK }} _active={{ transform: 'scale(0.98)' }} type="submit" disabled={isSubmitting || isTokenMissing} loading={isSubmitting}>
                                    {t('auth.reset.submit')}
                                </Button>

                                <Link fontSize="sm" fontWeight="semibold" color={SAGE_DARK} _hover={{ color: AMBER }} onClick={() => navigate('/login')} display="flex" alignItems="center" justifyContent="center" gap="1">
                                    <Icon name="arrow_back" size={16} />
                                    {t('auth.reset.back_to_login')}
                                </Link>
                            </Stack>
                        </form>
                    </Box>
                </Flex>
            </Flex>
        </>
    );
};

export default ResetPassword;