import * as path from 'path'

// Make sure the path is stored in posix manner
export function pathsetter(p:String):String{
	const pathItems = p.split(path.sep);
	return path.posix.join.apply(path.posix, pathItems);
}

// Make sure the path is retrived according to platform
export function pathgetter(p:String):String{
	const pathItems = p.split(path.posix.sep);
	return path.join.apply(path, pathItems);
}