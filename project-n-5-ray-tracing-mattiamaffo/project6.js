var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0,0,0);
	normal = normalize( normal );
	for ( int i=0; i<NUM_LIGHTS; ++i ) {
		// TO-DO: Check for shadows
		Ray shadowRay;
		shadowRay.pos = position;
		shadowRay.dir = normalize(lights[i].position - position);

		// TO-DO: If not shadowed, perform shading using the Blinn model
		
		color += mtl.k_d * lights[i].intensity;	// change this line
	}
	return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	hit.t = 1e30;
	bool foundHit = false;
	for ( int i=0; i<NUM_SPHERES; ++i ) {
		// TO-DO: Test for ray-sphere intersection
		Sphere s = spheres[i];
		float a = dot(ray.dir, ray.dir);
		float b = 2.0 * dot(ray.dir, ray.pos - s.center);
		float c = dot(ray.pos - s.center, ray.pos - s.center) - s.radius * s.radius;

		float discriminant = b * b - 4.0 * a * c;
		if (discriminant < 0.0) continue;
		else{
			float tnearest = (-b - sqrt(discriminant)) / (2.0 * a);
			if (tnearest <= 0.0) foundHit = false;
			else if (tnearest > hit.t) foundHit = false;
			else{
				foundHit = true;
				hit.t = tnearest;
				hit.position = ray.pos + tnearest * ray.dir;
				hit.normal = normalize(hit.position - s.center);
				hit.mtl = s.mtl;
			} 
		}
	}
	return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		// Compute reflections
		vec3 k_s = hit.mtl.k_s;
		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			
			Ray r;	// this is the reflection ray
			HitInfo h;	// reflection hit info
			
			// TO-DO: Initialize the reflection ray
			r.dir = normalize(ray.dir - 2.0 * dot(ray.dir, hit.normal) * hit.normal);
			r.pos = hit.position + 0.001 * r.dir; // bias=0.001
			
			if ( IntersectRay( h, r ) ) {
				// TO-DO: Hit found, so shade the hit point
				// TO-DO: Update the loop variables for tracing the next reflection ray
				clr += Shade( h.mtl, h.position, h.normal, view );
				
				hit = h;
				ray = r;
			} else {
				// The refleciton ray did not intersect with anything,
				// so we are using the environment color
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;	// no more reflections
			}
		}
		return vec4( clr, 1 );	// return the accumulated color, including the reflections
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
	}
}
`;