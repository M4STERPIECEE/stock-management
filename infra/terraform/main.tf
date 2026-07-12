resource "digitalocean_droplet" "k3s_node" {
  name     = "stock-management-${var.environment}"
  region   = var.region
  size     = var.droplet_size
  image    = "ubuntu-22-04-x64"
  ssh_keys = [var.ssh_key_fingerprint]
  tags     = ["stock-management", var.environment]

  user_data = file("${path.module}/cloud-init.yaml")
}

resource "digitalocean_firewall" "k3s_fw" {
  name = "stock-management-${var.environment}-fw"

  droplet_ids = [digitalocean_droplet.k3s_node.id]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }
  inbound_rule {
    protocol         = "tcp"
    port_range       = "6443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}
