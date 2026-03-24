package server

import (
	"github.com/juju/errors"
	"github.com/peer-calls/peer-calls/v4/server/logger"
	"github.com/pion/webrtc/v3"
)

func NewNetworkTypes(log logger.Logger, networkTypes []string) (ret []webrtc.NetworkType) {
	log = log.WithNamespaceAppended("network_types")

	for _, networkType := range networkTypes {
		// Expand shorthand 'udp' and 'tcp' to IPv4 and IPv6 variants
		// since pion/webrtc requires explicit udp4/udp6/tcp4/tcp6.
		var expanded []string
		switch networkType {
		case "udp":
			expanded = []string{"udp4", "udp6"}
		case "tcp":
			expanded = []string{"tcp4", "tcp6"}
		default:
			expanded = []string{networkType}
		}

		for _, ntStr := range expanded {
			nt, err := webrtc.NewNetworkType(ntStr)
			if err != nil {
				log.Error("NewNetworkType", errors.Trace(err), logger.Ctx{"network_type": ntStr})
				continue
			}
			ret = append(ret, nt)
		}
	}

	return ret
}
