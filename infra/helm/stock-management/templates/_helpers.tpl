{{- define "stock.fullname" -}}
{{ .Release.Name }}-stock-management
{{- end -}}

{{- define "stock.labels" -}}
app.kubernetes.io/name: stock-management
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
