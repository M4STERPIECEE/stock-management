variable "do_token" {
  description = "Token API DigitalOcean"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "Région DigitalOcean"
  type        = string
  default     = "fra1"
}

variable "droplet_size" {
  description = "Taille du droplet hébergeant k3s"
  type        = string
  default     = "s-2vcpu-4gb"
}

variable "ssh_key_fingerprint" {
  description = "Fingerprint de la clé SSH déjà enregistrée sur DigitalOcean"
  type        = string
}

variable "environment" {
  description = "Nom de l'environnement (dev, staging, prod)"
  type        = string
  default     = "prod"
}
