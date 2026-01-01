import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Flex,
    Text,
    Button,
    Input,
    Stack,
    Link,
    Span,
    IconButton,
    Grid,
    GridItem
} from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useColorMode } from '../../components/ui/color-mode';
import HeaderBar from '../../components/navigation/headerbar';

const SnackbarContent = ({ message, isError = false }: { message: string, isError?: boolean }) => {
    return (
        <Box
            position="fixed"
            bottom={8}
            left="50%"
            transform="translateX(-50%)"
            bg={isError ? "red.600" : "green.600"}
            color="white"
            px={6}
            py={3}
            borderRadius="lg"
            boxShadow="xl"
            display="flex"
            alignItems="center"
            gap={3}
            zIndex={9999}
            animation="fade-in 0.3s"
        >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                {isError ? 'error' : 'check_circle'}
            </span>
            <Text fontSize="md" fontWeight="medium">{message}</Text>
        </Box>
    );
};

const ResetPassword = () => {
    const { t } = useTranslation();
    const { colorMode } = useColorMode();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    const mainText = "textMain";
    const subText = "textSub";
    const cardBg = "card";
    const borderColor = "border";
    const inputBg = "inputBg";
    const inputBorder = "inputBorder";
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isTokenMissing = !token;

    const RequirementItem = ({ met, label }: { met: boolean, label: string }) => (
        <Flex align="center" gap="2" color={met ? "green.500" : "gray.400"}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {met ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            <Text fontSize="sm" fontWeight="medium">{label}</Text>
        </Flex>
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (password !== confirmPassword) {
            setErrorMessage("Les mots de passe ne correspondent pas.");
            return;
        }

        if (!hasMinLength || !hasUpperCase || !hasNumber || !hasSpecialChar) {
            setErrorMessage("Le mot de passe ne respecte pas les critères de sécurité.");
            return;
        }

        if (!token) {
            setErrorMessage("Jeton de réinitialisation manquant ou invalide.");
            return;
        }

        setIsSubmitting(true);

        try {
            const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, newPassword: password }),
            });

            if (response.ok) {
                setSuccessMessage("Mot de passe réinitialisé avec succès !");
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                const data = await response.json();
                setErrorMessage(data.message || "Erreur lors de la réinitialisation.");
            }
        } catch (error) {
            setErrorMessage("Impossible de contacter le serveur.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Span display="contents" className={`chakra-theme ${colorMode}`}>
            <Flex direction="column" minH="100vh" bg="background" color={mainText}>
                <HeaderBar />

                <Flex flex="1" align="center" justify="center" p={{ base: 4, sm: 8 }}>
                    <Box w="full" maxW="560px" bg={cardBg} borderRadius="xl" boxShadow="lg" border="1px" borderColor={borderColor} overflow="hidden">
                        <Box p="8" pb="4">
                            <Flex align="center" gap="2" mb="2">
                                <Flex h="10" w="10" rounded="full" bg="rgba(19, 127, 236, 0.1)" align="center" justify="center" color="primary" mb="2">
                                    <span className="material-symbols-outlined">key</span>
                                </Flex>
                            </Flex>
                            <Text fontSize="2xl" fontWeight="bold" lineHeight="tight" mb="2" color={mainText}>
                                Réinitialisation du mot de passe
                            </Text>
                            <Text fontSize="sm" lineHeight="relaxed" color={subText}>
                                Veuillez saisir votre nouveau mot de passe pour accéder à votre espace administrateur. Assurez-vous d'utiliser un mot de passe fort.
                            </Text>
                            {isTokenMissing && (
                                <Box mt="4" p="3" bg="red.50" border="1px" borderColor="red.200" borderRadius="lg" color="red.700" display="flex" alignItems="center" gap="2">
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
                                    <Text fontSize="sm" fontWeight="medium">Lien invalide ou expiré. Veuillez recommencer.</Text>
                                </Box>
                            )}
                        </Box>
                        <form onSubmit={handleSubmit}>
                            <Stack gap="6" p="8" pt="2">
                                <Stack gap="1.5">
                                    <Text fontSize="sm" fontWeight="medium" color={mainText}>Nouveau mot de passe</Text>
                                    <Box position="relative">
                                        <Input disabled={isTokenMissing} css={{ "&::-ms-reveal, &::-ms-clear": { display: "none" } }} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" h="12" bg={inputBg} borderColor={inputBorder} _focus={{ borderColor: "primary", ring: "1px", ringColor: "primary" }} pr="12" borderRadius="lg" />
                                        <IconButton disabled={isTokenMissing} aria-label="Toggle password visibility" variant="ghost" position="absolute" right="0" top="0" bottom="0" h="full" px="3" color={subText} bg="transparent" _hover={{ bg: "transparent", color: "primary" }} _active={{ bg: "transparent" }} onClick={() => setShowPassword(!showPassword)}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </IconButton>
                                    </Box>
                                </Stack>
                                {password.length > 0 && (
                                    <Box className="criteriaSuccess" bg={colorMode === 'light' ? "gray.50" : "whiteAlpha.100"} rounded="lg" p="4" border="1px" borderColor={borderColor}>
                                        <Text fontSize="xs" fontWeight="semibold" color={subText} textTransform="uppercase" letterSpacing="wider" mb="3">
                                            Critères de sécurité
                                        </Text>
                                        <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="3">
                                            <GridItem><RequirementItem met={hasMinLength} label="Au moins 8 caractères" /></GridItem>
                                            <GridItem><RequirementItem met={hasUpperCase} label="Une majuscule" /></GridItem>
                                            <GridItem><RequirementItem met={hasNumber} label="Un chiffre" /></GridItem>
                                            <GridItem><RequirementItem met={hasSpecialChar} label="Caractère spécial" /></GridItem>
                                        </Grid>
                                    </Box>
                                )}
                                <Stack gap="1.5">
                                    <Text fontSize="sm" fontWeight="medium" color={mainText}>Confirmer le nouveau mot de passe</Text>
                                    <Box position="relative">
                                        <Input disabled={isTokenMissing} css={{ "&::-ms-reveal, &::-ms-clear": { display: "none" } }} type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" h="12" bg={inputBg} borderColor={inputBorder} _focus={{ borderColor: "primary", ring: "1px", ringColor: "primary" }} pr="12" borderRadius="lg" />
                                        <IconButton disabled={isTokenMissing} aria-label="Toggle password visibility" variant="ghost" position="absolute" right="0" top="0" bottom="0" h="full" px="3" color={subText} bg="transparent" _hover={{ bg: "transparent", color: "primary" }} _active={{ bg: "transparent" }} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                                {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </IconButton>
                                    </Box>
                                </Stack>
                                {errorMessage && <SnackbarContent message={errorMessage} isError />}
                                {successMessage && <SnackbarContent message={successMessage} />}
                                <Box pt="2">
                                    <Button type="submit" w="full" h="12" bg="primary" color="white" fontSize="md" fontWeight="semibold" _hover={{ bg: "blue.600" }} borderRadius="lg" display="flex" alignItems="center" gap="2" loading={isSubmitting} disabled={isSubmitting || isTokenMissing}>
                                        <span>Enregistrer le mot de passe</span>
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
                                    </Button>
                                </Box>
                                <Flex justify="center">
                                    <Link as="button" onClick={() => navigate('/login')} fontSize="sm" fontWeight="medium" color={subText} _hover={{ color: mainText }}>
                                        Retour à la connexion
                                    </Link>
                                </Flex>
                            </Stack>
                        </form>
                    </Box>
                </Flex>
                <Box as="footer" w="full" py="6" textAlign="center" zIndex="10">
                    {t('login.copyright', { year: new Date().getFullYear() })}
                </Box>
            </Flex>
        </Span>
    );
};

export default ResetPassword;