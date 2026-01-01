import React, { useState } from 'react';
import {
    Box,
    Flex,
    Text,
    Button,
    Input,
    Stack,
    Link,
    Image,
    Container,
    InputGroup,
    Span
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useColorMode } from '../../components/ui/color-mode';
import HeaderBar from '../../components/navigation/headerbar';

const SnackbarContent = ({ message }: { message: string }) => {
    return (
        <Box
            position="fixed"
            bottom={8}
            left="50%"
            transform="translateX(-50%)"
            bg="green.600"
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
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>check_circle</span>
            <Text fontSize="md" fontWeight="medium">{message}</Text>
        </Box>
    );
};

const ForgotPasswordFormContent = () => {
    const { colorMode } = useColorMode();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const mainText = "textMain";
    const subText = "textSub";
    const borderColor = "border";
    const inputBg = "inputBg";
    const inputBorder = "inputBorder";
    const cardBg = "card";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsSubmitting(true);

        try {
            const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setSuccessMessage("Si cet email existe, un lien de réinitialisation a été envoyé");
                setTimeout(() => {
                    navigate('/link-verification');
                }, 1000);
            } else {
                setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
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
                <Flex flex="1" align="center" justify="center" p={{ base: 4, sm: 6, lg: 8 }}>
                    <Box w="full" maxW="480px" bg={cardBg} borderRadius="xl" boxShadow="lg" overflow="hidden" display="flex" flexDirection="column" borderColor={borderColor} border="1px">
                        <Box h={{ base: "40", sm: "48" }} bgImage="url('https://lh3.googleusercontent.com/aida-public/AB6AXuBnnKt_qt4J2OobPCy1KDHkkr8TbRn0c1mrXmj0Q2xjomvLAF8HHDdSLi2oGnLz-F5SnIo98qVZchcPCGaW2I78x3HN1g7LGpVb_POE_ktGJ-Uj0fuz5eek5sZNjE8hSKcp0m5RKsHIOX9SPoPu2deE6wVbci5aW4H5XrjtjaDeLMbGgJcpFInqFBqOlVtJ3A-jEtrS3nGnb3yPWSlqYgq3HI7apATFssT61tSEFOtdzX5qIXbjcX_tzHPZPnBinn0y-0XHmdR9qLQ7')" bgSize="cover" bgPos="center" position="relative">
                            <Box position="absolute" inset="0" bgGradient="linear(to-t, rgba(19, 127, 236, 0.9) 0%, rgba(19, 127, 236, 0.4) 100%)" />
                            <Flex position="absolute" inset="0" direction="column" justify="flex-end" p={{ base: 6, sm: 8 }}>
                                <Box w="12" h="12" bg="whiteAlpha.200" backdropFilter="blur(12px)" borderRadius="lg" display="flex" alignItems="center" justifyContent="center" mb="4" color="white">
                                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>lock_reset</span>
                                </Box>
                                <Text color="white" letterSpacing="tight" fontSize="2xl" fontWeight="bold" lineHeight="tight">
                                    Mot de passe oublié ?
                                </Text>
                            </Flex>
                        </Box>
                        <Box p={{ base: 6, sm: 8 }} display="flex" flexDirection="column" gap="6">
                            <Stack gap="2">
                                <Text color={subText} fontSize="md" lineHeight="relaxed">
                                    Pas de panique. Saisissez l'adresse e-mail associée à votre compte administrateur ci-dessous.
                                </Text>
                                <Text color="gray.500" fontSize="sm">
                                    Nous vous enverrons un lien sécurisé pour créer un nouveau mot de passe.
                                </Text>
                            </Stack>
                            <form onSubmit={handleSubmit}>
                                <Stack gap="6">
                                    <Box>
                                        <Text fontSize="sm" fontWeight="medium" mb="1" color={mainText}>Adresse e-mail professionnelle</Text>
                                        <InputGroup w="full" startElement={
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#94a3b8' }}>mail</span>
                                        }>
                                            <Input value={email} onChange={(e) => setEmail(e.target.value)} name="email" type="email" placeholder="admin@entreprise.com" size="lg" bg={inputBg} borderColor={inputBorder} _focus={{ borderColor: "primary", ring: "2px", ringColor: "primary" }} fontSize="md" h="12" borderRadius="lg" />
                                        </InputGroup>
                                    </Box>
                                    {errorMessage && <Text color="red.500" fontSize="sm">{errorMessage}</Text>}
                                    {successMessage && <SnackbarContent message={successMessage} />}
                                    <Button type="submit" w="full" h="12" bg="primary" color="white" fontSize="md" fontWeight="bold" letterSpacing="0.015em" _hover={{ bg: "blue.600" }} _active={{ transform: "scale(0.98)" }} borderRadius="lg" boxShadow="md" loading={isSubmitting}>
                                        Envoyer le lien de réinitialisation
                                    </Button>
                                </Stack>
                            </form>
                            <Flex align="center" py="1">
                                <Box flex="1" h="1px" bg={borderColor} />
                                <Text mx="4" color="gray.400" fontSize="sm">Ou</Text>
                                <Box flex="1" h="1px" bg={borderColor} />
                            </Flex>
                            <Flex justify="center">
                                <Button onClick={() => navigate('/login')} display="flex" alignItems="center" gap="2" bg={colorMode === 'light' ? "slate.800" : "slate.400"} color={colorMode === 'light' ? "slate.400" : "slate.800"} _hover={{ opacity: 0.9 }} fontSize="sm" fontWeight="medium" h="10" px="6" borderRadius="lg">
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                                    Retour à la connexion
                                </Button>
                            </Flex>

                        </Box>
                    </Box>
                </Flex>
                <Box as="footer" w="full" py="6" textAlign="center" zIndex="10">
                    <Text fontSize="sm" color={subText}>
                        © 2025 M4STERPIECE. Tous droits réservés.
                    </Text>
                </Box>
            </Flex>
        </Span>
    );
};

export default ForgotPasswordFormContent;
