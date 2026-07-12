output "droplet_ip" {
  description = "IP publique du nœud k3s"
  value       = digitalocean_droplet.k3s_node.ipv4_address
}

output "kubeconfig_fetch_cmd" {
  description = "Commande pour récupérer le kubeconfig depuis le serveur"
  value       = "scp root@${digitalocean_droplet.k3s_node.ipv4_address}:/etc/rancher/k3s/k3s.yaml ./kubeconfig.yaml"
}
