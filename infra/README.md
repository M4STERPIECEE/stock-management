# infra/ — Module Infrastructure StockManager

## Structure

```
infra/
├── docker-compose.yml   # Dev local (déjà en place, déplacé depuis la racine)
├── k8s/                 # Manifests K8s bruts (kubectl apply -k k8s/)
├── helm/                # Chart Helm équivalent, paramétrable (recommandé pour la prod)
├── terraform/            # Provisionne le nœud k3s (DigitalOcean, exemple)
└── argocd/               # Application(Set) ArgoCD pour le déploiement GitOps
```

## Workflow GitOps cible

```
git push → GitHub Actions (build + push image GHCR)
                     │
                     ▼
        ArgoCD détecte le nouveau tag / commit sur infra/helm
                     │
                     ▼
        Sync automatique sur le cluster k3s (self-heal + prune)
```

## 1. Dev local
```bash
cd infra
docker-compose up -d --build
```

## 2. Provisionner le serveur (Terraform)
```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # remplir do_token + ssh_key_fingerprint
terraform init
terraform apply
# récupérer le kubeconfig avec la commande donnée en output
```

## 3. Déployer manuellement (sans ArgoCD, pour tester)
```bash
# Option A — kubectl brut
kubectl apply -k infra/k8s

# Option B — Helm
helm install stock-management infra/helm/stock-management \
  --namespace stock-management --create-namespace \
  --set secrets.dbPassword=xxx --set secrets.jwtSecret=xxx
```
⚠️ Ne jamais mettre de vrais secrets dans `values.yaml` commité. Utiliser
`--set`, un `values-secret.yaml` gitignoré, ou un secret manager (SOPS,
Sealed Secrets, External Secrets Operator, Vault).

## 4. Déploiement GitOps (ArgoCD)
```bash
kubectl apply -f infra/argocd/application.yaml
# ou pour du multi-env (dev/prod) :
kubectl apply -f infra/argocd/applicationset.yaml
```
ArgoCD va ensuite surveiller `infra/helm/stock-management` sur le repo Git
et synchroniser automatiquement le cluster (prune + self-heal activés).

## Notes
- Les images backend/frontend sont attendues sur `ghcr.io/m4sterpiece77k/...`
  — à adapter dans `helm/stock-management/values.yaml` selon votre registre.
- Le Terraform fourni cible DigitalOcean à titre d'exemple ; la logique
  (provider + variables) est facilement transposable vers Scaleway, OVH,
  Hetzner ou un provider `kubernetes`/`helm` si un cluster managé existe déjà.
